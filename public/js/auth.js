const showPass = document.getElementById("show-password");
const password = document.getElementById('password');
const showAnswer = document.getElementById('show-answer');
const answer = document.getElementById('answer');

if (showPass) {
    showPass.addEventListener('click', function () {
        password.type = password.type === 'password' ? 'text' : 'password';
    });
}

if (showAnswer) {
    showAnswer.addEventListener('click', function () {
        answer.type = answer.type === 'password' ? 'text' : 'password';
    });
}