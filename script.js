function openEmail() {
        window.location.href = "mailto:your-sabyasachikumar2@gmail.com?subject=Hiring Inquiry";
    }
     var typed = new Typed('#typed', {
    strings: ['Passionate Learner', 'Tech Enthusiastic', 'Creative Problem Solver'],
    typeSpeed: 50,
    backSpeed: 30,
    loop: true,
    showCursor: true,
    cursorChar: '|',
    smartBackspace: true
  });
function showSkills() {
        var skillsSection = document.getElementById('skills');
        var projectSection = document.getElementById('project');
        var contactSection = document.getElementById('contact');

        // Show skills section and hide projects and contact sections
        skillsSection.style.display = 'block';
        projectSection.style.display = 'none';
        contactSection.style.display = 'none';
    }

    function showProjects() {
        var skillsSection = document.getElementById('skills');
        var projectSection = document.getElementById('project');
        var contactSection = document.getElementById('contact');

        // Show projects section and hide skills and contact sections
        projectSection.style.display = 'block';
        skillsSection.style.display = 'none';
        contactSection.style.display = 'none';
    }

    function showContact() {
        var skillsSection = document.getElementById('skills');
        var projectSection = document.getElementById('project');
        var contactSection = document.getElementById('contact');

        // Show contact section and hide skills and projects sections
        contactSection.style.display = 'block';
        skillsSection.style.display = 'none';
        projectSection.style.display = 'none';

        document.getElementById('contactForm').addEventListener('submit', function(event) {
            event.preventDefault();

            var name = document.getElementById('name').value.trim();
            var email = document.getElementById('email').value.trim();
            var phone = document.getElementById('phone').value.trim();
            var description = document.getElementById('description').value.trim();

            // Validate email format
            if (!validateEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Validate phone number format
            if (!validatePhone(phone)) {
                alert('Please enter a valid phone number with country code.');
                return;
            }

            // Validate description length
            if (description.length > 400) {
                alert('Message should not exceed 400 characters.');
                return;
            }

            // If all validations pass, display success message and reset form
            alert('Thanks for your feedback!');

            // Optionally, reset the form after submission
            document.getElementById('contactForm').reset();
        });

        function validateEmail(email) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function validatePhone(phone) {
            // Assuming the phone number format includes country code
            var phoneRegex = /^\+\d{1,3}\d{4,}$/;
            return phoneRegex.test(phone);
        }
    }
     document.getElementById('contactForm').addEventListener('submit', function(event) {
        event.preventDefault();
        // Your form submission code here

        // Show confirmation message
        document.getElementById('confirmationMessage').style.display = 'block';

        // Optionally, reset the form after submission
        document.getElementById('contactForm').reset();

        // Hide confirmation message after a certain time (e.g., 5 seconds)
        setTimeout(function() {
            document.getElementById('confirmationMessage').style.display = 'none';
        }, 5000); // 5000 milliseconds = 5 seconds
    });


