V ?= 0.1.0

deb:
	@echo "Creating .deb package..."

	@mkdir -p amd64/DEBIAN
	@sed 's/_VERSION_/$(V)/g' control.template > amd64/DEBIAN/control

	@rm -f amd64/usr/bin/du-tree
	@mkdir -p amd64/usr/bin/
	@ln ../../du-tree amd64/usr/bin/du-tree

	@dpkg-deb --build amd64 du-tree_$(V).deb