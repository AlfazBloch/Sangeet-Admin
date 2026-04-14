import React, { useRef, useState } from 'react'
import { RegisterContextProvider } from './register.context'

import Poster from './Poster'
import FormFieldWrapper from './FormFieldWrapper'
import GenderWrapper from './GenderWrapper'
import CountryWrapper from './CountryWrapper'
import ProfileWrapper from './ProfileWrapper'
import WavyPreloader from '../loaders/WavyPreloader'
import Login from './login/Login'


import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../app.css';

import style from './style.module.css'
import { regXPatterns, FetchWithAuthError, toastOption } from '../../utility'

function Register() {

  // ------------------hookes--------------------------
  const [formState, setFormState] = useState('sign-in');   //for toggle form
  const [formData, setFormData] = useState({
    name: {
      value: '',
      isEmpty: true,
      isValid: false,
      error: "Invalid Input: 2-16 Characters, Letters, Numbers, Underscore, or '@'."
    },
    gender: {
      value: '',
      isValid: false
    },
    country: {
      value: '',
      isValid: false
    },
    email: {
      value: '',
      isEmpty: true,
      isValid: false,
      error: "Oops! That Doesn't Look Like an Email Address."
    },
    password: {
      value: '',
      isEmpty: true,
      isValid: false,
      error: "Password Length must be Between 6 and 16 Characters."
    },
    confirmPassword: {
      value: '',
      isEmpty: true,
      isValid: false,
      error: 'Please Ensure the Passwords Match.'
    },
    profile: {
      value: null,
      isEmpty: true,
      isValid: false,
      selectedProfile: false,
      error: 'Profile must be Image.'
    }
  });
  const errorBoxesRef = useRef([]);        // keep ref of hideerrorbox method      
  const [serverErrors, setServerErrors] = useState({});      //stores serverside errors
  const [isLoading, setLoading] = useState(false);         // for loading
  const clearLoginFormRef = useRef();

  //----------------------------clear server error & form----------------------

  const clearLoginForm = (cb) => {
    clearLoginFormRef.current = cb;
  }

  const clearForm = () => {
    setFormData({
      name: {
        value: '',
        isEmpty: true,
        isValid: false,
        error: "Invalid Input: 2-16 Characters, Letters, Numbers, Underscore, or '@'."
      },
      gender: {
        value: '',
        isValid: false
      },
      country: {
        value: '',
        isValid: false
      },
      email: {
        value: '',
        isEmpty: true,
        isValid: false,
        error: "Oops! That Doesn't Look Like an Email Address."
      },
      password: {
        value: '',
        isEmpty: true,
        isValid: false,
        error: "Password Length must be Between 6 and 16 Characters."
      },
      confirmPassword: {
        value: '',
        isEmpty: true,
        isValid: false,
        error: 'Please Ensure the Passwords Match.'
      },
      profile: {
        value: null,
        isEmpty: true,
        isValid: false,
        selectedProfile: false,
        error: 'Profile must be Image.'
      }
    })
  }
  const clearServerError = () => {
    setServerErrors({});
  }

  //---------------------------- to remove specific server error---------------------------------
  const removeServerError = (key) => {
    if (serverErrors.hasOwnProperty(key)) {
      const newError = { ...serverErrors };
      delete newError[key];
      setServerErrors(newError);
    }
  }

  // ------------------------manupulate data with form fields-------------------------------------
  const manupulateFormData = (dataKey, dataValue) => {
    setFormData((prev) => {
      return { ...prev, [dataKey]: dataValue }
    })
  }

  //------------------------push hide errorbox method to errorboxesref ------------------
  const pushHideErrorMethod = (hideError) => {
    errorBoxesRef.current.push(hideError);
  }
  //-----------------------for hide all errorboxes-------------------------------------
  const handleMainContainerClick = () => {
    errorBoxesRef.current.forEach((hideError) => hideError())
  }

  //-----------------------validate form before submit to the server------------------
  const validateClient = () => {
    for (const key in formData) {
      if (!formData[key].isValid) {
        return false;
      }
    }
    return true;
  }

  // -----------------------fot submit event------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateClient()) {
      return
    }
    try {
      const artistData = new FormData();
      for (const key in formData) {
        artistData.append(key, formData[key].value);
      }
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'post',
        body: artistData
      });
      const data = await response.json();
      setLoading(false);
      if (data.code === 500) {
        throw new FetchWithAuthError(data, 'http error');
      }
      if (data.code != 200) {
        let errors = {}
        for (const key in data.errors) {
          errors[key] = data.errors[key].message
        }
        return setServerErrors(errors);
      }
      clearForm();
      setFormState('sign-in');
      toast.success("You're registered! Dive into the music.",toastOption);
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
        toast.error(message, toastOption);
      }
      setLoading(false);
    }
  }
  return (
    <RegisterContextProvider value={{ manupulateFormData, pushHideErrorMethod, serverErrors, setServerErrors, removeServerError, formState, setFormState, isLoading, setLoading }}>
      <div
        className={style.MainContainer}
        onClick={handleMainContainerClick}
      >

        <div className={style.PosterContainer}>
          <Poster />
        </div>

        <div className={style.FormContainer}>
          {/* form header */}
          <div className={style.FormHeader}>
            <span
              className={style.FormSwitchBtn}
              onClick={() => {
                setFormState('sign-in')
                clearServerError();
              }}
            >
              Sign-in
              <div
                className={` ${style.Border} ${formState == 'sign-in' ? style.ShowBorder : ''} `}
              ></div>
            </span>
            <span
              className={style.FormSwitchBtn}
              onClick={() => {
                setFormState('sign-up');
                clearForm();
                clearServerError();
                clearLoginFormRef.current();
              }}
            >
              Sign-up
              <div
                className={` ${style.Border} ${formState == 'sign-up' ? style.ShowBorder : ''} `}
              ></div>
            </span>
          </div>

          {/* form body */}
          <form className={`${style.FormBody} ${formState !== 'sign-up' ? style.Hide : ''}`}>

            <FormFieldWrapper fieldName='Name' dataKey='name' dataValue={formData.name} regX={regXPatterns.unmRegX} />

            <GenderWrapper dataKey='gender' dataValue={formData.gender} />

            <CountryWrapper dataKey='country' dataValue={formData.country} />

            <FormFieldWrapper fieldName='Email' dataKey='email' dataValue={formData.email} regX={regXPatterns.emailRegX} />

            <FormFieldWrapper fieldName='Create Password' fieldType='password' dataKey='password' dataValue={formData.password} regX={regXPatterns.pwdRegX} confirmPassword={formData.confirmPassword} />

            <FormFieldWrapper fieldName='Confirm Password' fieldType='password' dataKey='confirmPassword' dataValue={formData.confirmPassword} passwordValue={formData.password.value} />

            <ProfileWrapper dataKey='profile' dataValue={formData.profile} />

            <div className={style.BottomLink}>
              <span>If you've already sign-up, </span>
              <span
                className={style.Link}
                onClick={() => {
                  setFormState('sign-in')
                  clearForm();
                }}
              >please sign-in.</span>
            </div>

            <button
              type='submit'
              className={style.FormSubmitBtn}
              onClick={handleSubmit}
            >Sign-Up</button>

          </form>
          <Login clearForm={clearLoginForm} />
        </div>

        <div className={`${style.LoaderContainer} ${isLoading ? style.ShowFlex : style.Hide}`}>
          <WavyPreloader />
        </div>
        <ToastContainer />
      </div>
    </RegisterContextProvider>
  )
}

export default Register