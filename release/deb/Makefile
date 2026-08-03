V ?= 0.1.0

deb:
	@echo "Creating .deb package..."

	@sed 's/_VERSION_/$(V)/g' control.template > amd64/DEBIAN/control

	@rm -f amd64/usr/bin/du-tree
	@ln ../../du-tree amd64/usr/bin/du-tree

	@dpkg-deb --build amd64 du-tree_$(V).deb