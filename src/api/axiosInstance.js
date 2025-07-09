import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// Aggiunta del token all'header Authorization
instance.interceptors.request.use(config => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default instance;
