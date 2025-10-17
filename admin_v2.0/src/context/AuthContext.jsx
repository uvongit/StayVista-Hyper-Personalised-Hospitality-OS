import { createContext, useEffect, useReducer } from "react";
import { clearAuth, getAuth, setAuth } from "../utils/authStorage.js";

const INITIAL_STATE = {
  ...getAuth(),
  loading: false,
  error: null,
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        accessToken: null,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        accessToken: null,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        loading: false,
        error: null,
      };
    case "UPDATE_USER":
    case "UPDATE_AUTH": {
      const nextUser = action.payload?.user ?? state.user ?? null;
      const hasTokenUpdate = Object.prototype.hasOwnProperty.call(action.payload || {}, "accessToken");
      const nextAccessToken = hasTokenUpdate
        ? action.payload?.accessToken ?? null
        : state.accessToken ?? null;
      return {
        user: nextUser,
        accessToken: nextAccessToken,
        loading: false,
        error: null,
      };
    }
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    if (state.user && state.accessToken) {
      setAuth({ user: state.user, accessToken: state.accessToken }, { emit: false });
    } else {
      clearAuth({ emit: false });
    }
  }, [state.user, state.accessToken]);

  useEffect(() => {
    const handleAuthUpdated = (event) => {
      const detail = event?.detail || {};
      dispatch({
        type: "UPDATE_AUTH",
        payload: {
          user: detail.user ?? null,
          accessToken: detail.accessToken ?? null,
        },
      });
    };

    window.addEventListener("admin-auth:updated", handleAuthUpdated);
    return () => window.removeEventListener("admin-auth:updated", handleAuthUpdated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
