<?php

// http://localhost:8000/sql-injection.php?dsn=mysql:host=localhost;dbname=mysql&username=root&password=&query=SELECT%20*%20FROM%20user
// http://localhost:8000/sql-injection.php?dsn=mysql:host=localhost;dbname=mysql&username=root&password=&query=SHOW%20PROCESSLIST
// http://localhost:8000/sql-injection.php?dsn=mysql:host=localhost;dbname=mysql&username=root&password=&query=SELECT%20*%20FROM%20user%20WHERE%20Host%20=%20?&params=[%22127.0.0.1%22]

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Expose-Headers: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $options = null;
        foreach ($_REQUEST as $key => $value) {
            if (str_starts_with($key, 'PDO::')) {
                $options[constant($key)] = $value;
            }
        }
        $dbh = new PDO($_REQUEST['dsn'], $_REQUEST['username'], $_REQUEST['password'], $options);
        if (isset($_REQUEST['params'])) {
            $stmt = $dbh->prepare($_REQUEST['query']);
            $stmt->execute(json_decode($_REQUEST['params']));
            header('Content-type: application/json');
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif (isset($_REQUEST['query'])) {
            $stmt = $dbh->query($_REQUEST['query']);
            header('Content-type: application/json');
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    } catch (PDOException $e) {
        http_response_code(400);
        header('Content-type: application/json');
        echo json_encode($e->getMessage());
    }
}