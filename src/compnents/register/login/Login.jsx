import { useEffect, useState } from 'react';

import style from '../style.module.css';
import { regXPatterns, extractDataFromObjOfObj, FetchWithAuthError, toastOption } from '../../../utility.js';
import LoginFormFieldWrapper from './LoginFormFieldWrapper';
import { useRegister } from '../register.context.js';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

function login({ clearForm }) {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({
        name: {
            value: '',
            isEmpty: true,
            isValid: false,
            error: "Invalid Input: 2-16 Characters, Letters, Numbers, Underscore, or '@'."
        },
        password: {
            value: '',
            isEmpty: true,
            isValid: false,
            error: "Password Length must be Between 6 and 16 Characters."
        }
    });

    const clearLoginForm = () => {
        setLoginData({
            name: {
                value: '',
                isEmpty: true,
                isValid: false,
                error: "Invalid Input: 2-16 Characters, Letters, Numbers, Underscore, or '@'."
            },
            password: {
                value: '',
                isEmpty: true,
                isValid: false,
                error: "Password Length must be Between 6 and 16 Characters."
            }
        });
    }
    useEffect(() => {
        clearForm(clearLoginForm);
    }, [])

    const { setServerErrors, formState, setFormState, setLoading } = useRegister();

    const manupulateLoginData = (dataKey, dataValue) => {
        setLoginData((prev) => {
            return { ...prev, [dataKey]: dataValue }
        })
    }

    const validateClient = () => {
        for (const key in loginData) {
            if (!loginData[key].isValid) {
                return false;
            }
        }
        return true;
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateClient()) {
            return;
        }
        try {
            setLoading(true);
            const data = extractDataFromObjOfObj(loginData, 'value');
            const response = await fetch('http://localhost:8080/api/login', {
                method: 'post',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            const user = await response.json();
            setLoading(false);
            if (user.code === 500) {
                throw new FetchWithAuthError(user, 'http error');
            }
            if (user.code != 200) {
                const errors = extractDataFromObjOfObj(user.errors, 'message');
                return setServerErrors(errors);
            }
            navigate('/admin-panel');
        }
        catch (error) {
            if (error.name === 'TypeError') {
                toast.error('Network error,Please check your internet connection.', toastOption);
            }
            else if (error instanceof FetchWithAuthError) {
                const err = error.errorObj;
                let message = ''
                for (const key in err.errors) {
                    message = err.errors[key].message
                }
                toast.error(message, toastOption)
            }
            setLoading(false);
        }
    }


    return (
        <form className={`${style.FormBody} ${formState !== 'sign-in' ? style.Hide : ''}`}>
            <LoginFormFieldWrapper fieldName='Name' dataKey='name' dataValue={loginData.name} regX={regXPatterns.unmRegX} manupulateLoginData={manupulateLoginData} />
            <LoginFormFieldWrapper fieldName='Password' fieldType='password' dataKey='password' dataValue={loginData.password} regX={regXPatterns.pwdRegX} manupulateLoginData={manupulateLoginData} />
            <div className={style.BottomLink}>
                <span>First time here? </span>
                <span
                    className={style.Link}
                    onClick={() => {
                        setFormState('sign-up');
                        clearLoginForm();
                    }}
                >sign-up </span>
                <span>to get started!"</span></div>
            <button
                type='submit'
                className={style.FormSubmitBtn}
                onClick={handleLogin}
            >Sign-In</button>
        </form>
    )
}

export default login