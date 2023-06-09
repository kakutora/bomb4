const express = require("express");
const path = require('path');
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// ドキュメントルートの設定

app.use(express.static(path.join(__dirname, '/views')));

/*
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/views/index.html");
});
*/

app.use("/js", express.static(__dirname + "/js/"));
app.use("/img", express.static(__dirname + "/img/"));

app.use(
    "/io",
    express.static(__dirname + "/node_modules/socket.io/client-dist/")
);

server.listen(3000, () => {
    console.log("Server started on port 3000");
});

const fs = require('fs');
const filePath = 'json/futsu_ga_ichiban.json';

const players = {};

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('ファイルの読み込みエラー:', err);
        return;
    }

    // 読み込まれたデータをJSONとしてパースします
    const jsonData = JSON.parse(data);

    // ここでjsonDataを使って必要な処理を行います

    io.on("connection", (socket) => {
        const playerID = socket.id;
        let x = 32;
        let y = 32;

        players[playerID] = {
            x: x,
            y: y
        };

        socket.emit("assignPlayerIdPos", { pid: playerID, y: y, x: x });

        socket.emit("mapData", jsonData);

        socket.emit("playerUpdate", players);

        socket.on("playerMove", (data) => {
            players[playerID] = data;
            io.emit("playerUpdate", players);
        });

        socket.on('beforeDisconnect', (reason) => {
            const userId = socket.id; // ユーザの socket.id を取得

            socket.emit("dpl2", userId);
            console.log(players[userId].x, players[userId].y);
        });

        socket.on("disconnect", () => {
            // プレイヤー情報を削除
            console.log(players[playerID]);
            socket.emit("dpl", players[playerID]);

            delete players[playerID];
            io.emit("playerUpdate", players);

        });
    });
});