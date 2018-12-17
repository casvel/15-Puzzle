// https://puzzleanel.appspot.com

package main

import (
	"fmt"
	"net/http"
	"html/template"
	"encoding/json"
	"strings"
	"container/heap"
	"strconv"
	"math"
	"math/rand"
	"time"
	"os"
	"path/filepath"
	"sync"

	// "cloud.google.com/go/pubsub"
	// "cloud.google.com/go/storage"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"google.golang.org/appengine"
)

// type myMux map[string]map[string]func(http.ResponseWriter, *http.Request)
// type myHandler struct {}

type appHandler func(http.ResponseWriter, *http.Request)

var (
	port = 8010

	// mux myMux = make(map[string]map[string]func(http.ResponseWriter, *http.Request))
	filehttp  = http.NewServeMux()
	currentImage = -1
)
var images = []string{}

func main() {
	// mux.addRoute("/", handleHome, []string{"GET"})
	// mux.addRoute("/solve", handleSolve, []string{"POST"})
	// mux.addRoute("/images", handleImage, []string{"GET"})
	
	// filehttp.Handle("/", http.FileServer(http.Dir("."))) // files

	r := mux.NewRouter()
	r.Handle("/", http.RedirectHandler("/15Puzzle", http.StatusFound))

	r.Methods("GET").Path("/15Puzzle").Handler(appHandler(handleHome))
	r.Methods("POST").Path("/15Puzzle/solve").Handler(appHandler(handleSolve))
	r.Methods("GET").Path("/15Puzzle/images").Handler(appHandler(handleImage))
	r.PathPrefix("/javascripts/").Handler(http.FileServer(http.Dir(".")))
	r.PathPrefix("/styles/").Handler(http.FileServer(http.Dir(".")))
	r.PathPrefix("/images_reduced/").Handler(http.FileServer(http.Dir(".")))

	// filehttp.Handle("/javascripts", http.FileServer(http.Dir("./javascripts"))) // files

	// r.PathPrefix("/").Handler(http.FileServer(http.Dir(".")))

	fmt.Printf("Server for Anel's Puzzle running on port %d\n", port);

	// [START request_logging]
	// Delegate all of the HTTP routing and serving to the gorilla/mux router.
	// Log all requests using the standard Apache format.
	http.Handle("/", handlers.CombinedLoggingHandler(os.Stderr, r))

	// var h *myHandler
	// http.ListenAndServe(fmt.Sprintf(":%d", port), r) // Uncomment this line to make it work locally

	appengine.Main() // Comment this line to make it work locally
}

// func (m *myMux) addRoute(path string, f func(http.ResponseWriter, *http.Request), methods []string) {
// 	for i := range methods {
// 		_, ok := (*m)[methods[i]]
// 		if ok == false {
// 			(*m)[methods[i]] = make(map[string]func(http.ResponseWriter, *http.Request))
// 		}
// 		(*m)[methods[i]][path] = f
// 	}
// }

func (fn appHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	fmt.Printf("Serving HTTP request %s\n", req.URL.Path);

	if (strings.Contains(req.URL.Path, ".")) {
		fmt.Printf("Returning static file\n");
		filehttp.ServeHTTP(rw, req)
		return;
	}

	fn(rw, req);

	

	// fmt.Printf("Handling request\n");
	// if f, ok := mux[req.Method][req.URL.Path]; ok {
	// 	f(rw, req)
	// } else {
	// 	fmt.Printf("Couldn't find handler for request %s\n", req.URL.Path);
	// }
}

func handleImage(rw http.ResponseWriter, req *http.Request) {
	fmt.Printf("Handle image\n");

	var mutex = &sync.Mutex{}
	mutex.Lock()
	if len(images) == 0 {
		// init array
	    root := "./images_reduced"
	    filepath.Walk(root, func(path string, info os.FileInfo, err error) error {

	    	if filepath.Ext(path) != ".jpeg" && filepath.Ext(path) != ".jpg" {
	    		// os.Remove(path)
	    	} else {
		    	if !info.IsDir() {
		        	images = append(images, path)
		        }
		    }
	        return nil
	    })

	    // for i := range images {
	   	// 	fmt.Printf("%s\n", images[i])
	    // }

	    r := rand.New(rand.NewSource(time.Now().UnixNano()))
	    for i := 0; i < len(images); i += 1 {
	    	j := r.Intn(len(images))
	    	temp := images[j]
	    	images[j] = images[i]
	    	images[i] = temp
	    }
	}
	mutex.Unlock();

	var respJson []byte
	if strings.Contains(req.URL.Path, "next") {
		currentImage = (currentImage + 1) % len(images)
		respJson, _ = json.Marshal(images[currentImage])
	} else if strings.Contains(req.URL.Path, "prev") {
		if currentImage == 0 {
			currentImage = len(images)-1 
		} else { 
			currentImage = currentImage-1
		}
		respJson, _ = json.Marshal(images[currentImage])
	} else {
		respJson, _ = json.Marshal(images)
	}

	rw.Write(respJson)
}

func handleHome(rw http.ResponseWriter, req *http.Request) {
	fmt.Printf("Handle home\n");

	t, err  := template.ParseFiles("views/index.html")
	if err != nil {
		panic(err)
	}
	t.Execute(rw, nil)
}

func handleSolve(rw http.ResponseWriter, req *http.Request) {
	fmt.Printf("Handle solve\n");

	time_start := time.Now()

	req.ParseForm()

	var ans string

	grid  := req.Form["grid[]"]
	start := encode(grid)

	visited := make(map[uint64]bool)
	dB := [4]int{4, 16, -4, -16} //"R", "D", "L", "U"

	pq := &Heap{&Item{0, start, "", 0}}
	visited[start] = true
	heap.Init(pq)

	for pq.Len() > 0 {
		
		node := heap.Pop(pq).(*Item)

		if isTarget(node.Config) {
			ans = node.Moves
			break
		}

		var zero int
		for i := 0; i <= 60; i += 4 {
			if (node.Config >> uint(i)) & 15 == 0 {
				zero = i
				break
			}
		}

		for k := 0; k < 4; k++ {
			nZero := zero + dB[k]

			if nZero < 0 || nZero > 60 || (zero%16 == 0 && k == 2) || (zero%16 == 12 && k == 0) { continue }

			nConfig := swapTiles(node.Config, uint(zero), uint(nZero))

			if visited[nConfig] { continue }

			nMoves  := node.Moves + strconv.Itoa(k)
			nSteps  := node.Steps+1
			nValue  := nSteps + g(nConfig)

			visited[nConfig] = true
			heap.Push(pq, &Item{nValue, nConfig, nMoves, nSteps})
		}
	}

	fmt.Printf("Found solution! %d moves. Took %s\n", len(ans), time.Since(time_start))

	respJson, _ := json.Marshal(ans)
	rw.Write(respJson)
}

func g(config uint64) int {
	return manhattanDistance(config) + 2*linearConflict(config)
}

func isTarget(config uint64) bool {

	for i := 1; i <= 16; i++ {

		x := (int)(config & (uint64)(15))
		if x == 0 { x = 16 }

		if x != i { return false }
		config >>= 4
	}

	return true
}

func swapTiles(config uint64, i, j uint) uint64 {

	var u uint64 = 1
	var new_config uint64 = config
	var a uint64 = (u<<(i)) | (u<<(i+1)) | (u<<(i+2)) | (u<<(i+3)) 
	var b uint64 = (u<<(j)) | (u<<(j+1)) | (u<<(j+2)) | (u<<(j+3))

	new_config &= (^a) & (^b)

	a = ((config & a) >> i)
	b = ((config & b) >> j)	

	new_config |= (a << j) | (b << i)

	return new_config
} 

func linearConflict(config uint64) int {

	var u uint64 = 1
	var conf int = 0

	for i := uint64(0); i <= 56; i += 4 {
		for j := i+4; j%16 != 0; j += 4 {
			var a uint64 = (u<<(i)) | (u<<(i+1)) | (u<<(i+2)) | (u<<(i+3)) 
			var b uint64 = (u<<(j)) | (u<<(j+1)) | (u<<(j+2)) | (u<<(j+3))

			a = ((config & a) >> i)-1
			b = ((config & b) >> j)-1

			if a < 0 || b < 0 { continue }

			xA, xB, xD := a/4, b/4, i/16
			
			if xA == xD && xB == xD && a > b { 
				conf++ 
			}
		}
	} 

	return conf
}

func manhattanDistance(config uint64) int {
	
	var dist int = 0

	for i := 0; i < 4; i++ {
		for j := 0; j < 4; j++ {

			k := (int)(config & (uint64)(15))-1
			config >>= 4

			if k == -1 { continue }

			x, y := k/4, k%4
			dist += (int)(math.Abs((float64)(i-x)) + math.Abs(float64(j-y)))
		}
	}

	return dist
}

func decode(config uint64) []int {
	var grid []int

	for i := 0; i < 16; i++ {
		x := (int)(config & (uint64)(15))
		config >>= 4
		grid = append(grid, x)
	}

	return grid
}

func encode(grid []string) uint64 {
	var config uint64

	for i := 15; i >= 0; i-- {
		config <<= 4
		x, _ := strconv.Atoi(grid[i])
		config |= (uint64)(x)
	} 

	return config
}