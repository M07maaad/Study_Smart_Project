// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  
  // 🚨 Replace this with your actual Vercel app URL
  const API_BASE_URL = 'https://study-smart-project.vercel.app/'; 

  const coursesList = document.getElementById('courses-list');

  // Async function to fetch courses from the API
  async function fetchCourses() {
    try {
      // Fetch data from the /api/courses endpoint
      const response = await fetch(`${API_BASE_URL}/api/courses`);

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const courses = await response.json();
      
      // Clear the "Loading..." message
      coursesList.innerHTML = '';

      // Check if there are no courses
      if (courses.length === 0) {
        coursesList.innerHTML = '<li>لم يتم إضافة أي مواد دراسية بعد.</li>';
        return;
      }

      // Loop through each course and create a list item for it
      courses.forEach(course => {
        const listItem = document.createElement('li');
        listItem.textContent = course.name; // Display the course name
        coursesList.appendChild(listItem);
      });

    } catch (error) {
      // If an error occurs, display an error message
      console.error('Failed to fetch courses:', error);
      coursesList.innerHTML = '<li class="error">حدث خطأ أثناء تحميل المواد. يرجى المحاولة مرة أخرى.</li>';
    }
  }

  // Call the function to fetch and display the courses
  fetchCourses();
});
