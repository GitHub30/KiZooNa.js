<?php

function json_response($value)
{
    header('Content-type: application/json');
    echo json_encode($value);
}

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
        } elseif (isset($_REQUEST['query'])) {
            $stmt = $dbh->query($_REQUEST['query']);
        }

        if (isset($stmt)) {
            if (isset($_REQUEST['lastInsertId'])) {
                if (isset($_REQUEST['lastInsertId_name'])) {
                    json_response($dbh->lastInsertId($_REQUEST['lastInsertId_name']));
                } else {
                    json_response($dbh->lastInsertId());
                }
            } else if (isset($_REQUEST['rowCount'])) {
                json_response($stmt->rowCount());
            } else if (isset($_REQUEST['columnCount'])) {
                json_response($stmt->columnCount());
            } else if (isset($_REQUEST['fetchColumn'])) {
                if (isset($_REQUEST['fetchColumn_column']) && is_numeric($_REQUEST['fetchColumn_column'])) {
                    json_response($stmt->fetchColumn((int)$_REQUEST['fetchColumn_column']));
                } else {
                    json_response($stmt->fetchColumn());
                }
            } else if (isset($_REQUEST['fetch'])) {
                if (isset($_REQUEST['fetch_mode'])) {
                    $mode = array_sum(array_map(fn ($name) => constant($name), explode('|', $_REQUEST['fetch_mode'])));
                    json_response($stmt->fetch($mode));
                } else {
                    json_response($stmt->fetch(PDO::FETCH_ASSOC));
                }
            } else {
                if (isset($_REQUEST['fetchAll_mode'])) {
                    $mode = array_sum(array_map(fn ($name) => constant($name), explode('|', $_REQUEST['fetchAll_mode'])));
                    json_response($stmt->fetchAll($mode));
                } else {
                    json_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                }
            }
        }
    } catch (PDOException $e) {
        http_response_code(400);
        header('Content-type: application/json');
        echo json_encode($e->getMessage());
    }
}
