# Universal Enterprises – Website (Dockerized)

Static site (HTML/CSS/JS) served by nginx.

## Run (recommended – live editing)
    docker compose up -d --build
Open: http://localhost:8080  (on a server: http://<server-ip>:8080)

Edit any file inside `main/` (index.html, about.html, styles.css, script.js),
save, and refresh the browser — changes show instantly, no rebuild needed.

## Change the port
Edit `docker-compose.yml`:  `"8080:80"` -> `"<your-port>:80"`

## Stop
    docker compose down

## Run without compose (baked image, no live edit)
    docker build -t universal-site .
    docker run -d -p 8080:80 --name universal-site universal-site
(After editing files, rebuild the image to see changes.)
