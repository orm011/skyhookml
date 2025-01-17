import json
import numpy
import skimage.io, skimage.transform
import torch

import skyhook.common as lib

# Read one input item.
# Currently we assume the input must be a single element of a sequence type.
def read_input(dataset, item):
	data = lib.load_item(dataset, item)
	data = lib.data_index(dataset['DataType'], data, 0)
	return data

# Image, video: represented as one tensor of size [batch, channels, height, width]
# Integer: represented as integer tensor of size [batch, 1]
# Floats: represented as float tensoro of size [batch, n]
# Shape: {
#   counts: [batch] number of shapes in each image
#   infos: [sum(counts), 2] 0 is class, 1 is number of points in each shape
#   points: [sum(infos[:, 1]), 2] x/y coordinates of points
# }
# Detection: {
#   counts: [batch] number of detections in each shape
#   detections: [sum(counts), 5] 0 is class, 1:4 is sx/sy/ex/ey
# }
def prepare_input(t, data, opt):
	if t == 'image' or t == 'video' or t == 'array':
		im = data
		if opt.get('Width', 0) and opt.get('Height', 0):
			im = skimage.transform.resize(im, [opt['Height'], opt['Width']], preserve_range=True).astype(im.dtype)
		return im.transpose(2, 0, 1)
	elif t == 'int':
		return numpy.array(data['Ints'], dtype='int64')
	elif t == 'floats':
		return numpy.array(data, dtype='float32')
	elif t == 'shape':
		# we will normalize the points by the canvas dims
		dims = data['Metadata']['CanvasDims']
		categories = data['Metadata'].get('Categories', [])

		# encode as 3-tuple: (# shapes, clsid + # points in each shape, flat points concat across the shapes)
		shape_info = numpy.zeros((len(data['Shapes']), 2), dtype='int32')
		points = []
		for i, shape in enumerate(data['Shapes']):
			if 'Category' in shape and shape['Category'] in categories:
				shape_info[i, 0] = categories.index(shape['Category'])
			shape_info[i, 1] = len(shape['Points'])

			for p in shape['Points']:
				p = (float(p[0])/dims[0], float(p[1])/dims[1])
				points.append(p)

		points = numpy.array(points, dtype='float32')
		return {
			'counts': len(data['Shapes']),
			'infos': shape_info,
			'points': points
		}
	elif t == 'detection':
		# we will normalize the points by the canvas dims
		dims = data['Metadata']['CanvasDims']
		categories = data['Metadata'].get('Categories', [])

		# encode as 2-tuple: (# detections, then flat clsid+bboxes)
		count = len(data['Detections'])
		detections = numpy.zeros((count, 5), dtype='float32')
		for i, d in enumerate(data['Detections']):
			if 'Category' in d and d['Category'] in categories:
				detections[i, 0] = categories.index(d['Category'])
			detections[i, 1:5] = [
				float(d['Left'])/dims[0],
				float(d['Top'])/dims[1],
				float(d['Right'])/dims[0],
				float(d['Bottom'])/dims[1],
			]

		return {
			'counts': count,
			'detections': detections
		}

	raise Exception('unknown type {}'.format(t))

def collate(t, data_list):
	if t == 'shape':
		return {
			'counts': torch.from_numpy(numpy.array([data['counts'] for data in data_list], dtype='int32')),
			'infos': torch.cat([torch.from_numpy(data['infos']) for data in data_list], dim=0),
			'points': torch.cat([torch.from_numpy(data['points']) for data in data_list], dim=0),
		}
	elif t == 'detection':
		return {
			'counts': torch.from_numpy(numpy.array([data['counts'] for data in data_list], dtype='int32')),
			'detections': torch.cat([torch.from_numpy(data['detections']) for data in data_list], dim=0),
		}
	else:
		return torch.stack([torch.from_numpy(data) for data in data_list], dim=0)

def inputs_to_device(inputs, device):
	for i, d in enumerate(inputs):
		if isinstance(d, tuple):
			inputs[i] = [x.to(device) for x in d]
		elif isinstance(d, dict):
			inputs[i] = {k: x.to(device) for k, x in d.items()}
		else:
			inputs[i] = d.to(device)
