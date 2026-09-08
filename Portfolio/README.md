# Portfolio

This is a static portfolio website designed to run on GitHub Pages without a build step.

## Local preview

From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Open the repository in GitHub.
3. Go to Settings → Pages.
4. Set the source to `Deploy from a branch`.
5. Choose the `main` branch and the root folder `/`.
6. Save.

GitHub Pages will publish the site automatically.

## Notes

- The site uses only static HTML, CSS, and JavaScript.
- The `.nojekyll` file prevents GitHub from processing the folder with Jekyll.
- All links are relative so the site works correctly from the repository root and from project subpages.
