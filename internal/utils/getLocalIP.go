package utils

import "net"

func GetLocalIP() (re string, err error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return
	}

	for _, a := range addrs {
		if ipnet, ok := a.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				re = ipnet.IP.String()
				break
			}
		}
	}

	return
}
