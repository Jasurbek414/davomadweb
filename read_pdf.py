import PyPDF2

def extract_text(pdf_path):
    text = ""
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text()
    
    with open("pdf_text.txt", "w", encoding="utf-8") as out:
        out.write(text)
    print("Done")

if __name__ == "__main__":
    extract_text("maktab_faceid_tz_v2.pdf")
