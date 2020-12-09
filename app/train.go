package app

import (
	"../skyhook"

	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func (node *DBTrainNode) Run() error {
	op := skyhook.GetTrainOp(node.Op)
	err := op.Train("http://127.0.0.1:8080", node.TrainNode)
	if err != nil {
		return err
	}
	db.Exec("UPDATE train_nodes SET trained = 1 WHERE id = ?", node.ID)
	return nil
}

func init() {
	Router.HandleFunc("/train-nodes", func(w http.ResponseWriter, r *http.Request) {
		skyhook.JsonResponse(w, ListTrainNodes())
	}).Methods("GET")

	Router.HandleFunc("/train-nodes", func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		name := r.PostForm.Get("name")
		op := r.PostForm.Get("op")
		node := NewTrainNode(name, op)
		skyhook.JsonResponse(w, node)
	}).Methods("POST")

	Router.HandleFunc("/train-nodes/{node_id}", func(w http.ResponseWriter, r *http.Request) {
		nodeID := skyhook.ParseInt(mux.Vars(r)["node_id"])
		node := GetTrainNode(nodeID)
		if node == nil {
			http.Error(w, "no such train node", 404)
			return
		}
		skyhook.JsonResponse(w, node)
	}).Methods("GET")

	Router.HandleFunc("/train-nodes/{node_id}", func(w http.ResponseWriter, r *http.Request) {
		nodeID := skyhook.ParseInt(mux.Vars(r)["node_id"])
		node := GetTrainNode(nodeID)
		if node == nil {
			http.Error(w, "no such train node", 404)
			return
		}

		var request TrainNodeUpdate
		if err := skyhook.ParseJsonRequest(w, r, &request); err != nil {
			return
		}

		node.Update(request)
	}).Methods("POST")

	Router.HandleFunc("/train-nodes/{node_id}/run", func(w http.ResponseWriter, r *http.Request) {
		nodeID := skyhook.ParseInt(mux.Vars(r)["node_id"])
		node := GetTrainNode(nodeID)
		if node == nil {
			http.Error(w, "no such train node", 404)
			return
		}
		go func() {
			err := node.Run()
			if err != nil {
				log.Printf("[train node %s] run error: %v", node.Name, err)
			}
		}()
	}).Methods("POST")

	Router.HandleFunc("/pytorch/components", func(w http.ResponseWriter, r *http.Request) {
		skyhook.JsonResponse(w, ListPytorchComponents())
	}).Methods("GET")

	Router.HandleFunc("/pytorch/components", func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		name := r.PostForm.Get("name")
		comp := NewPytorchComponent(name)
		skyhook.JsonResponse(w, comp)
	}).Methods("POST")

	Router.HandleFunc("/pytorch/components/{comp_id}", func(w http.ResponseWriter, r *http.Request) {
		compID := skyhook.ParseInt(mux.Vars(r)["comp_id"])
		comp := GetPytorchComponent(compID)
		if comp == nil {
			http.Error(w, "no such PytorchComponent", 404)
			return
		}
		skyhook.JsonResponse(w, comp)
	}).Methods("GET")

	Router.HandleFunc("/pytorch/components/{comp_id}", func(w http.ResponseWriter, r *http.Request) {
		compID := skyhook.ParseInt(mux.Vars(r)["comp_id"])
		comp := GetPytorchComponent(compID)
		if comp == nil {
			http.Error(w, "no such PytorchComponent", 404)
			return
		}

		var request PytorchComponentUpdate
		if err := skyhook.ParseJsonRequest(w, r, &request); err != nil {
			return
		}

		comp.Update(request)
	}).Methods("POST")

	Router.HandleFunc("/pytorch/archs", func(w http.ResponseWriter, r *http.Request) {
		skyhook.JsonResponse(w, ListPytorchArchs())
	}).Methods("GET")

	Router.HandleFunc("/pytorch/archs", func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		name := r.PostForm.Get("name")
		arch := NewPytorchArch(name)
		skyhook.JsonResponse(w, arch)
	}).Methods("POST")

	Router.HandleFunc("/pytorch/archs/{arch_id}", func(w http.ResponseWriter, r *http.Request) {
		archID := skyhook.ParseInt(mux.Vars(r)["arch_id"])
		arch := GetPytorchArch(archID)
		if arch == nil {
			http.Error(w, "no such PytorchArch", 404)
			return
		}
		skyhook.JsonResponse(w, arch)
	}).Methods("GET")

	Router.HandleFunc("/pytorch/archs/{arch_id}", func(w http.ResponseWriter, r *http.Request) {
		archID := skyhook.ParseInt(mux.Vars(r)["arch_id"])
		arch := GetPytorchArch(archID)
		if arch == nil {
			http.Error(w, "no such PytorchArch", 404)
			return
		}

		var request PytorchArchUpdate
		if err := skyhook.ParseJsonRequest(w, r, &request); err != nil {
			return
		}

		arch.Update(request)
	}).Methods("POST")
}
