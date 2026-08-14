package scanner

import (
	"du-tree/internal/models"
)

var pageSize = 100

func filter(input []*models.Node, filters models.ReqFilters) []*models.Node {
	re := make([]*models.Node, len(input))

	var moreThan float64 = -1
	switch filters.MoreThan.Unit {
	case "parent %":
		moreThan = 1.0 / 100.0 * filters.MoreThan.Value
	}
	i := 0
	for _, n := range input {
		if filters.HideHidden && n.Name[0] == '.' {
			continue
		}

		if float64(n.Size) <= moreThan {
			continue
		}

		re[i] = n
		i++
	}

	return re
}

func filterBranchCont(br *models.Branch, req models.Request) {
	contLen := pageSize * req.Pages
	// fmt.Println(req.Filters)
	// helpers.TempPrinAsJson(req.Filters)
	if len(br.Content) > contLen*2 {
		br.IsFiltered = true
		cont := filter(br.Content, req.Filters)

		if len(cont) > contLen {
			br.ContentCount = len(cont)
			br.Content = cont[:contLen]
		}
	}
}
