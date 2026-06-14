package helpers

func LimitSlice[T any](s []T, limit int) []T {
	if len(s) <= limit {
		return s
	}

	return s[:limit]
}
