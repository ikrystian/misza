<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Logowanie — Panel MISZA</title>
<link rel="stylesheet" href="/public/admin/admin.css">
</head>
<body class="admin-login-body">
<main class="admin-login">
  <form class="admin-login__card" id="loginForm" novalidate>
    <a class="admin__logo" href="/">MISZA<i>®</i> <span>Admin</span></a>
    <p class="admin-login__error" id="loginError" hidden></p>
    <label>
      <span>Login</span>
      <input type="text" name="username" autocomplete="username" required autofocus>
    </label>
    <label>
      <span>Hasło</span>
      <input type="password" name="password" autocomplete="current-password" required>
    </label>
    <button type="submit" class="admin-btn">Zaloguj</button>
  </form>
</main>
<script src="/public/admin/admin.js"></script>
</body>
</html>
