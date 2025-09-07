import { request } from 'umi';

export async function fetchTasks() {
  try {
    const response = await request('/api/v1/creations/', {
      method: 'GET',
    });
    console.log('Raw API response for fetchTasks:', response);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.data) {
      return response.data;
    } else if (response) {
      return response;
    }
    return [];
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    throw error;
  }
}

export async function fetchTaskStatus(taskId: string) {
  try {
    const response = await request(`/api/v1/creations/${taskId}`, {
      method: 'GET',
    });
    console.log(`Raw API response for task ${taskId}:`, response);
    return response;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
}