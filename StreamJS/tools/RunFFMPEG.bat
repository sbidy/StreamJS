C:\bin\ffmpeg.exe -re -i D:\TestMovie.avi -f webm -r 50 http://localhost:8081

https://trac.ffmpeg.org/wiki/Capture/Webcam


C:\bin\ffmpeg.exe -rtbufsize 2100M -f dshow -framerate 30 -i video="Logitech HD Webcam C270" -f webm -r 30 http://localhost:8081

C:\bin\ffplay.exe http://localhost:8080

ffmpeg -list_devices true -f dshow -i dummy

QuickCam for Notebooks Deluxe