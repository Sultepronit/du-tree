package scanner

import "du-tree/internal/models"

var pageSize = 100

func filter(input []*models.Node, filters models.ReqFilters) []*models.Node {
	re := make([]*models.Node, len(input))
	i := 0
	for _, n := range input {
		if !filters.ShowHidden && n.Name[0] == '.' {
			continue
		}

		re[i] = n
		i++
	}

	return re
}

func filterBranchCont(br *models.Branch, req models.Request) {
	contLen := pageSize * req.Pages

	if len(br.Content) > contLen*2 {
		br.IsFiltered = true
		cont := filter(br.Content, req.Filters)

		if len(cont) > contLen {
			br.ContentCount = len(cont)
			br.Content = cont[:contLen]
		}
	}
}
