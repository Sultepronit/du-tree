package helpers

func LimitSlice[T any](s []T, limit int) []T {
	if len(s) <= limit {
		return s
	}

	return s[:limit]
}

// func sortBySize[T any](s []// return branch, nilT) {
// 	slices.SortFunc(s, func(a, b T) int {
// 		if a.Size == b.Size {
// 			return cmp.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
// 		}
// 		return cmp.Compare(b.Size, a.Size)
// 	})
// }
