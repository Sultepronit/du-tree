# DU-Tree
Yet another look at the classic `du` & `tree` utilities.
> **Designed for Linux. Tested on Linux.**

The idea is simple! Standalone binary. Written in Go with almost no dependencies. You execute it. With the ability to set the scan path immediately (the `-s` flag). And here is the total size in bytes.
<img width="1435" height="255" alt="image" src="https://github.com/user-attachments/assets/09de52c6-57e2-4c74-b6eb-c88036ae79df" />
But. This is not just any binary. This is a local web server! You open the link in your browser, *by default it is `localhost:51200`, but you can change it to your custom port (the `-p` flag)*. And here is the magic! The Web UI!

Vanilla HTML, CSS, TS & a little esbuild magic, and here we go! An interactive file/directory tree with many details!
<img width="1437" height="799" alt="image" src="https://github.com/user-attachments/assets/b4a606d2-b5fa-4cdf-b5d0-e383b75df017" />

### Usage

Grab the latest release from the **[releases section](../../releases)**. There are standalone binaries & .deb packages available.

You can directly download the files using `wget` or `curl`, but check what is available first.
```bash
wget -O du-tree https://github.com/Sultepronit/du-tree/releases/download/v0.2.0/du-tree
chmod +x du-tree
```
```bash
wget https://github.com/Sultepronit/du-tree/releases/download/v0.3.0/du-tree.deb
sudo dpkg -i du-tree.deb
```

#### CLI options

```bash
$ ./du-tree --help
Usage of ./du-tree:
  -A    Apparent size of files (instead of the default block size = actual disk usage)
  -E    Exclude hidden items
  -O    One FS (skip directories (&files) on different file systems)
  -e value
        Exclude pattern (can be used multiple times)
  -p string
        The server port (default "51200")
  -s string
        The scan path
```

*The version is 0.3.0+. (And I promise there will be more!) So. No stability. No detailed manual, because tomorrow there would be new details! Try it. Test it. Leave your feedback. **Thank you!***

### Credits

**DU-Tree** uses, and therefore exists thanks to:

* **Icons:** [Lucide Icons](https://lucide.dev/)
* **Typography:** [Ubuntu Font Family](https://design.ubuntu.com/font/)
* **Go libraries:** [fsnotify](https://github.com/fsnotify/fsnotify) & [esbuild](https://github.com/evanw/esbuild)
