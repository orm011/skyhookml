package yolov3

import (
	"../../skyhook"
	"../../exec_ops"

	"bufio"
	"fmt"
	"io"
	"strings"
	"sync"
)

func Prepare(url string, node skyhook.ExecNode, outputDatasets []skyhook.Dataset) (skyhook.ExecOp, error) {
	var params Params
	skyhook.JsonUnmarshal([]byte(node.Params), &params)

	// load model path from first input dataset
	datasets, err := exec_ops.ParentsToDatasets(url, node.Parents[0:1])
	if err != nil {
		return nil, err
	}
	modelItems, err := exec_ops.GetItems(url, datasets)
	if err != nil {
		return nil, err
	}
	modelItem := modelItems["model"][0]
	strdata, err := modelItem.LoadData()
	if err != nil {
		return nil, err
	}
	modelPath := strdata.(skyhook.StringData).Strings[0]

	batchSize := 8

	cmd := skyhook.Command(
		fmt.Sprintf("yolov3-exec-%s", node.Name), skyhook.CommandOptions{},
		"python3", "exec_ops/yolov3/run.py",
		fmt.Sprintf("%d", modelPath),
		fmt.Sprintf("%d", batchSize),
		fmt.Sprintf("%d", params.InputSize[0]), fmt.Sprintf("%d", params.InputSize[1]),
	)

	return &Yolov3{
		URL: url,
		Dataset: outputDatasets[0],
		cmd: cmd,
		stdin: cmd.Stdin(),
		rd: bufio.NewReader(cmd.Stdout()),
		batchSize: batchSize,
		dims: params.InputSize,
	}, nil
}

type Yolov3 struct {
	URL string
	Dataset skyhook.Dataset

	mu sync.Mutex
	cmd *skyhook.Cmd
	stdin io.WriteCloser
	rd *bufio.Reader
	batchSize int
	dims [2]int
}

func (e *Yolov3) Parallelism() int {
	return 1
}

func (e *Yolov3) Apply(task skyhook.ExecTask) error {
	data, err := task.Items[0].LoadData()
	if err != nil {
		return err
	}
	reader := data.(skyhook.ReadableData).Reader()
	defer reader.Close()
	var detections [][]skyhook.Detection
	zeroImage := skyhook.NewImage(e.dims[0], e.dims[1])
	for {
		imageData, err := reader.Read(e.batchSize)
		if err == io.EOF {
			break
		} else if err != nil {
			return err
		}
		images := imageData.(skyhook.ImageData).Images

		e.mu.Lock()
		// write this batch of images
		for _, im := range images {
			if im.Width != e.dims[0] || im.Height != e.dims[1] {
				im = im.Resize(e.dims[0], e.dims[1])
			}
			e.stdin.Write(im.Bytes)
		}
		for i := len(images); i < e.batchSize; i++ {
			e.stdin.Write(zeroImage.Bytes)
		}

		// read the output detections for the batch
		signature := "json"
		var line string
		for {
			line, err = e.rd.ReadString('\n')
			if err != nil || strings.Contains(line, signature) {
				break
			}
		}
		e.mu.Unlock()

		if err != nil {
			return fmt.Errorf("error reading from yolov3 script: %v", err)
		}

		line = strings.TrimSpace(line[len(signature):])
		var batchDetections [][]skyhook.Detection
		skyhook.JsonUnmarshal([]byte(line), &batchDetections)
		detections = append(detections, batchDetections...)
	}

	output := skyhook.DetectionData{
		Detections: detections,
		Metadata: skyhook.DetectionMetadata{
			CanvasDims: e.dims,
		},
	}
	return exec_ops.WriteItem(e.URL, e.Dataset, task.Key, output)
}

func (e *Yolov3) Close() {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.stdin.Close()
	if e.cmd != nil {
		e.cmd.Wait()
		e.cmd = nil
	}
}

func init() {
	skyhook.ExecOpImpls["yolov3_infer"] = skyhook.ExecOpImpl{
		Requirements: func(url string, node skyhook.ExecNode) map[string]int {
			return nil
		},
		GetTasks: func(url string, node skyhook.ExecNode, rawItems [][]skyhook.Item) ([]skyhook.ExecTask, error) {
			// the first input dataset in the model
			// so we just provide the rest to SimpleTasks
			return exec_ops.SimpleTasks(url, node, rawItems[1:])
		},
		Prepare: Prepare,
		ImageName: func(url string, node skyhook.ExecNode) (string, error) {
			return "skyhookml/yolov3", nil
		},
	}
}