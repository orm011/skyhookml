package skyhook

import (
	"io"
	"io/ioutil"
	"math"
)

type DetectionMetadata struct {
	CanvasDims [2]int
	Categories []string `json:",omitempty"`
}

type Detection struct {
	Left int
	Top int
	Right int
	Bottom int

	// Optional metadata
	Category string `json:",omitempty"`
	TrackID int `json:",omitempty"`
	Score float64 `json:",omitempty"`
	Metadata map[string]string `json:",omitempty"`
}

func (d Detection) CenterDistance(other Detection) float64 {
	dx := (d.Left+d.Right-other.Left-other.Right)/2
	dy := (d.Top+d.Bottom-other.Top-other.Bottom)/2
	return math.Sqrt(float64(dx*dx+dy*dy))
}

func (d Detection) Rescale(origDims [2]int, newDims [2]int) Detection {
	copy := d
	copy.Left = copy.Left * newDims[0] / origDims[0]
	copy.Right = copy.Right * newDims[0] / origDims[0]
	copy.Top = copy.Top * newDims[1] / origDims[1]
	copy.Bottom = copy.Bottom * newDims[1] / origDims[1]
	return copy
}

type DetectionData struct {
	Detections [][]Detection
	Metadata DetectionMetadata
}

func (d DetectionData) EncodeStream(w io.Writer) error {
	return WriteJsonData(d, w)
}

func (d DetectionData) Encode(format string, w io.Writer) error {
	_, err := w.Write(JsonMarshal(d.Detections))
	return err
}

func (d DetectionData) Type() DataType {
	return DetectionType
}

func (d DetectionData) GetDefaultExtAndFormat() (string, string) {
	return "json", "json"
}

func (d DetectionData) GetMetadata() interface{} {
	return d.Metadata
}

// SliceData
func (d DetectionData) Length() int {
	return len(d.Detections)
}
func (d DetectionData) Slice(i, j int) Data {
	return DetectionData{
		Detections: d.Detections[i:j],
		Metadata: d.Metadata,
	}
}
func (d DetectionData) Append(other Data) Data {
	other_ := other.(DetectionData)
	return DetectionData{
		Detections: append(d.Detections, other_.Detections...),
		Metadata: other_.Metadata,
	}
}

func (d DetectionData) Reader() DataReader {
	return &SliceReader{Data: d}
}

func init() {
	DataImpls[DetectionType] = DataImpl{
		DecodeStream: func(r io.Reader) (Data, error) {
			var data DetectionData
			if err := ReadJsonData(r, &data); err != nil {
				return nil, err
			}
			return data, nil
		},
		DecodeFile: func(format string, metadataRaw string, fname string) (Data, error) {
			var metadata DetectionMetadata
			JsonUnmarshal([]byte(metadataRaw), &metadata)

			data := DetectionData{Metadata: metadata}
			ReadJSONFile(fname, &data.Detections)
			return data, nil
		},
		Decode: func(format string, metadataRaw string, r io.Reader) (Data, error) {
			var metadata DetectionMetadata
			JsonUnmarshal([]byte(metadataRaw), &metadata)

			bytes, err := ioutil.ReadAll(r)
			if err != nil {
				return nil, err
			}
			data := DetectionData{Metadata: metadata}
			JsonUnmarshal(bytes, &data.Detections)
			return data, nil
		},
		GetDefaultMetadata: func(fname string) (format string, metadataRaw string, err error) {
			return "json", "{}", nil
		},
		Builder: func() ChunkBuilder {
			return &SliceBuilder{Data: DetectionData{}}
		},
		ChunkType: DetectionType,
	}
}
