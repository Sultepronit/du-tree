package scanner

import (
	"du-tree/internal/models"
)

var pageSize = 100

// func filter(input []*models.Node, filters models.ReqFilters) []*models.Node {
func filter(br *models.Branch, filters models.ReqFilters) []*models.Node {
	// re := make([]*models.Node, len(input))
	re := make([]*models.Node, 0, len(br.Content))

	var moreThan float64 = -1
	switch filters.MoreThan.Unit {
	case "parent %":
		moreThan = float64(br.Size) / 100.0 * filters.MoreThan.Value
	}
	// i := 0
	// for _, n := range input {
	for _, n := range br.Content {
		if filters.HideHidden && n.Name[0] == '.' {
			continue
		}

		if float64(n.Size) <= moreThan {
			continue
		}

		re = append(re, n)
		// re[i] = n
		// i++
	}

	return re
}

// func filterBranchCont(br *models.Branch, req models.Request) {
func filterBranchCont(br *models.Branch, pages int, flters models.ReqFilters) {
	// contLen := pageSize * req.Pages
	contLen := pageSize * pages
	// fmt.Println(req.Filters)
	// helpers.TempPrinAsJson(req.Filters)
	if len(br.Content) > contLen*2 {
		br.IsFiltered = true
		// cont := filter(br.Content, req.Filters)
		// cont := filter(br.Content, flters)
		cont := filter(br, flters)

		if len(cont) > contLen {
			br.ContentCount = len(cont)
			br.Content = cont[:contLen]
		} else {
			br.Content = cont
		}
	}
}
