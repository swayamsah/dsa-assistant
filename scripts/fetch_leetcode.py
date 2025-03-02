from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import sys
import json

def fetch_problem_description(url):
    # Set up Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1280,720")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    # Initialize the WebDriver
    service = Service(ChromeDriverManager().install())
    browser = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Load the LeetCode problem page
        browser.get(url)
        
        # Wait for the element with class name "elfjS" (the problem description)
        wait = WebDriverWait(browser, 10)
        problem_description = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "elfjS")))
        
        result = {
            "description": problem_description.text.strip(),
            "found": True
        }
        
    except Exception as e:
        print("Error:", str(e), file=sys.stderr)
        result = {
            "description": "",
            "found": False
        }
    
    finally:
        browser.quit()
    
    print(json.dumps(result))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"description": "", "found": False}))
        sys.exit(1)
    
    fetch_problem_description(sys.argv[1])
