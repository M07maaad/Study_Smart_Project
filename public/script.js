document.addEventListener('DOMContentLoaded', () => {
  
  // The API URL is now relative because the frontend and backend are on the same domain.
  // This is much simpler!
  const API_URL = '/api/courses'; 

  const coursesList = document.getElementById('courses-list');

  async function fetchCourses() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const courses = await response.json();
      
      coursesList.innerHTML = '';

      if (courses.length === 0) {
        coursesList.innerHTML = '<li>لم يتم إضافة أي مواد دراسية بعد.</li>';
        return;
      }

      courses.forEach(course => {
        const listItem = document.createElement('li');
        listItem.textContent = course.name;
        coursesList.appendChild(listItem);
      });

    } catch (error) {
      console.error('Failed to fetch courses:', error);
      coursesList.innerHTML = '<li class="error">حدث خطأ أثناء تحميل المواد. يرجى المحاولة مرة أخرى.</li>';
    }
  }

  fetchCourses();
});
