import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;


export const fetchNotifications = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/get_notifications/`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const clearNotifications = async (token) => {
    try {
        const response = await axios.delete(`${API_URL}/clear_notifications/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error clearing notifications:', error);
        throw error;
    }
};