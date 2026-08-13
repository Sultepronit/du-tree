package helpers

import (
	"cmp"
	"du-tree/internal/models"
	"slices"
	"strings"
)

// func LimitSlice[T any](s []T, limit int) []T {
// 	if len(s) <= limit {
// 		return s
// 	}

// 	return s[:limit]
// }

func SortBySizeThenName[T models.SortNode](s []T) {
	slices.SortFunc(s, func(a, b T) int {
		if a.GetSize() == b.GetSize() {
			return cmp.Compare(strings.ToLower(a.GetName()), strings.ToLower(b.GetName()))
		}
		return cmp.Compare(b.GetSize(), a.GetSize())
	})
}
