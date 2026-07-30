# DU Tree
Yet another look at the classic `du` & `tree` utilities.
> **Designed for Linux. Tested on Linux.**

The idea is simple! Single binary. Written in Go with almost no dependencies. You execute it. With the ability to set the scan path immediately (the `-s` flag). And here is the total size in bytes.
<img width="1241" height="281" alt="image" src="https://github.com/user-attachments/assets/b5c73055-adb7-4856-9cd4-41af744714b3" />
But. This is not just any binary. This is a local web server! You open the link in your browser, by default it is `localhost:51200`, or you can change it to your custom port (the `-p` flag). And here is the magic! I call it the Web GUI!

Vanilla HTML, CSS, TS & a little esbuild magic, and here we go! An interactive file/directory tree with many details!
<img width="1257" height="672" alt="image" src="https://github.com/user-attachments/assets/7c8fafb1-a460-411e-a138-ceae7c5b80f6" />

### CLI options

```bash
$ ./du-tree --help
Usage of ./du-tree:
  -A    To get the apparent size of files instead of the default block size
  -p string
        The server port (default "51200")
  -s string
        The scan path
```

### Usage

Grab the latest release from the **[Releases](../../releases)** page.

*The version is 0.1.0. And I promise there will be more! So. No stability. No detailed manual, because tomorrow there would be new details! Try it. Test it. Leave your feedback. **Thank you!***

###  Credits

**DU Tree** uses, and therefore exists thanks to:

* **Icons:** [Lucide Icons](https://lucide.dev/)
* **Typography:** [Ubuntu Font Family](https://design.ubuntu.com/font/)
* **Go libraries:** [fsnotify](https://github.com/fsnotify/fsnotify) & [esbuild](https://github.com/evanw/esbuild)
