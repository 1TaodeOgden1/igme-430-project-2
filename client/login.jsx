const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleLogin = (e) => {
    e.preventDefault();
    helper.hideError();

    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;

    //clear pass field
    e.target.querySelector('#pass').value = '';

    if (!username || !pass) {
        helper.handleError('Username or password is empty!');
        return false;
    }

    helper.sendPost(e.target.action, { username, pass });

    return false;
}

const handleSignup = (e) => {
    e.preventDefault();
    helper.hideError();

    const username = e.target.querySelector('#user').value;
    const pass = e.target.querySelector('#pass').value;
    const pass2 = e.target.querySelector('#pass2').value;

    //clear pass field
    e.target.querySelector('#pass').value = '';
    e.target.querySelector('#pass2').value = '';



    if (!username || !pass || !pass2) {
        helper.handleError('All fields are required!');
        return false;
    }

    if (pass !== pass2) {
        helper.handleError('Passwords do not match!');
        return false;
    }

    helper.sendPost(e.target.action, { username, pass, pass2 });

    return false;
}

const LoginWindow = (props) => {
    return (
        <form id="loginForm"
            name="loginForm"
            onSubmit={handleLogin}
            action='/login'
            method="POST"
            class="block is-flex is-flex-direction-column m-1 columns is-justify-content-center">
            <h1 class="title has-text-black">Log in</h1>
            <div id="errorDiv" class='hidden'>
                <h3 class='has-text-danger-dark is-size-6 block'><span id="errorMessage"></span></h3>
            </div>
            <div class='block'>
                <div class='block'>
                    <div class="label">Username:</div>
                    <input id="user" type="text" name="username" placeholder='username' class=" column is-full" />
                </div>
                <div class='block'>
                    <div class="label">Password:</div>
                    <input id='pass' type='password' name='pass' placeholder='password' class=" column is-full" />
                </div>
            </div>
            <div class='control p-auto'>
                <button class="button is-link" type='submit'>Sign in</button>
            </div>

        </form>
    );
};

const SignupWindow = (props) => {
    return (
        <form id="signupForm"
            name="signupForm"
            onSubmit={handleSignup}
            action='/signup'
            method="POST"
            class="block is-flex is-flex-direction-column m-1 columns is-justify-content-center">
            <h1 class="title has-text-black">Sign up</h1>
            <div id="errorDiv" class='hidden'>
                <h3 class='has-text-danger-dark is-size-6 block'><span id="errorMessage"></span></h3>
            </div>
            <div class='block'>
                <div class='block'>
                    <div class="label">Enter a username:</div>
                    <input id="user" type="text" name="username" placeholder='username' class=" column is-full" />
                </div>
                <div class='block'>
                    <div class="label">Enter your password:</div>
                    <input id='pass' type='password' name='pass' placeholder='password' class=" column is-full" />
                </div>
                <div class='block'>
                    <div class="label">Confirm password:</div>
                    <input id='pass2' type='password' name='pass2' placeholder='retype password' class=" column is-full" />
                </div>
            </div>
            <div class='control'>
                <button class="button is-link" type='submit'>Submit</button>
            </div>
        </form>
    )
}

const init = () => {
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');

    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        ReactDOM.render(<LoginWindow />,
            document.getElementById('content'));
        return false;
    });

    signupButton.addEventListener('click', (e) => {
        e.preventDefault();
        ReactDOM.render(<SignupWindow />,
            document.getElementById('content'));
        return false;
    });

    ReactDOM.render(<LoginWindow />,
        document.getElementById('content'));
}

window.onload = init; 