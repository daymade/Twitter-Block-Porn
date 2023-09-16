package main

import (
	"encoding/json"
	"fmt"
	"github.com/thoas/go-funk"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const (
	InputDir         = "lists/snapshot"
	IntermediateFile = "lists/lists.json"
	AllFile          = "lists/all.json"
	BlockFile        = "lists/block.json"
	JailbreakFile    = "lists/jailbreakFile.json"
)

type User struct {
	IDStr      string `json:"id_str"`
	ScreenName string `json:"screen_name"`
	Name       string `json:"name"`
}

func main() {
	files, _ := os.ReadDir(InputDir)
	for _, file := range files {
		filename := file.Name()
		if !strings.HasSuffix(filename, "json") {
			continue
		}
		fmt.Println(filename)
		outputFile := filepath.Join("lists", filename)

		processFile(filename, outputFile)
	}

	// Merge block file with intermediate file to create final output
	mergeFiles(BlockFile, IntermediateFile, AllFile)
}

func processFile(rawListFile, outputListFile string) {
	// Extract necessary information and write to a snapshot file
	snapshot := readFile(filepath.Join(InputDir, rawListFile))
	writeFile(filepath.Join(InputDir, rawListFile+".snapshot"), snapshot)

	// Merge the snapshot file with the current output file, ensuring uniqueness
	listFileUsers := readFile(outputListFile)

	listFileUsers = append(snapshot, listFileUsers...)
	listFileUsers = getUniqueUsers(listFileUsers)

	writeFile(outputListFile, listFileUsers)

	subtract := funk.Subtract(listFileUsers, snapshot).([]User)
	jailbreakFileUsers := readFile(JailbreakFile)

	jailbreakFileUsers = append(subtract, jailbreakFileUsers...)
	jailbreakFileUsers = getUniqueUsers(jailbreakFileUsers)

	writeFile(JailbreakFile, jailbreakFileUsers)

	// Merge the output file with the intermediate file
	intermediateFileUsers := readFile(IntermediateFile)

	intermediateFileUsers = append(listFileUsers, intermediateFileUsers...)
	intermediateFileUsers = getUniqueUsers(intermediateFileUsers)

	writeFile(IntermediateFile, intermediateFileUsers)
}

func readFile(path string) []User {
	raw, err := os.ReadFile(path)
	var users []User
	if err != nil {
		return users
	}
	json.Unmarshal(raw, &users)
	sortUsers(users)
	return users
}

func writeFile(path string, users []User) {
	bytes, _ := json.MarshalIndent(users, "", "    ")
	os.WriteFile(path, bytes, 0644)
}

func getUniqueUsers(users []User) []User {
	unique := funk.Uniq(users).([]User)
	sortUsers(unique)
	return unique
}

func sortUsers(users []User) {
	sort.Slice(users, func(i, j int) bool {
		return users[i].IDStr < users[j].IDStr
	})
}

func mergeFiles(file1, file2, outputFile string) {
	users1 := readFile(file1)
	users2 := readFile(file2)

	merged := append(users1, users2...)
	unique := getUniqueUsers(merged)

	writeFile(outputFile, unique)
}
