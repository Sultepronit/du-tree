package helpers

import (
	"cmp"
	"du-tree/internal/models"
	"slices"
	"strings"
)

func SortBySizeThenName[T models.SortNode](s []T) {
	slices.SortFunc(s, func(a, b T) int {
		if a.GetSize() == b.GetSize() {
			return cmp.Compare(strings.ToLower(a.GetName()), strings.ToLower(b.GetName()))
		}
		return cmp.Compare(b.GetSize(), a.GetSize())
	})
}
