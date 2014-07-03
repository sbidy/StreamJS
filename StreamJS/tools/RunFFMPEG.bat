C:\bin\ffmpeg-20140328-git-64b7914-win32-static\bin\ffmpeg.exe -re -i D:\TestMovie.avi -f webm -r 50 http://localhost:8081

https://trac.ffmpeg.org/wiki/Capture/Webcam


C:\bin\ffmpeg-20140328-git-64b7914-win32-static\bin\ffmpeg.exe -rtbufsize 2100M -f dshow -framerate 30 -i video="Logitech HD Webcam C270" -f webm -r 30 http://localhost:8081

C:\bin\ffmpeg-20140328-git-64b7914-win32-static\bin\ffplay.exe http://localhost:8080