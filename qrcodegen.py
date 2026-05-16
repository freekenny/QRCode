import qrcode
import re
import yt_dlp
from reportlab.lib.pagesizes import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER

# --- 1. List of weblinks to process ---
weblinks = [
    "https://youtu.be/0TCI0tfaZ94"
    
]

# --- NEW: Refactored Cleaning Functions ---

def clean_title_text(name):
    """ 
    Removes invalid characters and hashtags from a string.
    This is used for the PDF's visible title.
    """
    # Remove standard invalid filename characters
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    # Remove hash tags
    name = name.replace("#", "")
    # Strip any leading/trailing whitespace that might result
    return name.strip()

def create_safe_filename(name):
    """ 
    Takes a clean title, replaces spaces with underscores,
    and limits length for a safe filename.
    """
    # Replace spaces with underscores
    filename = name.replace(" ", "_")
    # Limit length
    return filename[:100]

# --- End of New Functions ---

def draw_footer(canvas, doc):
    """ Footer drawing function (no changes) """
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(
        doc.width + doc.leftMargin,
        doc.bottomMargin * 0.75,
        "LDesignMD"
    )
    canvas.restoreState()

# Get standard styles
styles = getSampleStyleSheet()

# --- 2. Main loop to process each weblink ---

# Set options for yt-dlp
ydl_opts = {
    'quiet': True,
    'skip_download': True,
    'no_warnings': True,
}

for original_url in weblinks:
    try:
        print(f"--- Processing: {original_url} ---")
        
        # --- 2a. Fetch and Clean YouTube Title ---
        raw_title = None
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(original_url, download=False)
            raw_title = info.get('title', 'Unknown_Video_Title')
            
        # --- NEW: Split title to make it shorter ---
        # Takes only the first part of the title before a "|"
        main_title = raw_title.split('|')[0].strip()
        
        # --- Clean the SHORTER title for both PDF and filename use ---
        video_title = clean_title_text(main_title)
        
        print(f"Found title: {raw_title}")
        print(f"Cleaned title: {video_title}")

        # --- 2c. Set up dynamic filenames ---
        # Create the safe filename from the *already cleaned* title
        safe_title = create_safe_filename(video_title) 
        pdf_filename = f"{safe_title}.pdf"
        qr_image_filename = f"{safe_title}_qr.png"
        
        data = original_url 

        # --- 2d. QR Code Generation ---
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")
        img_qr.save(qr_image_filename)
        print(f"QR code image '{qr_image_filename}' saved.")

        # --- 2e. PDF Creation ---
        PAGE_WIDTH = 4 * inch
        PAGE_HEIGHT = 6 * inch

        doc = SimpleDocTemplate(
            pdf_filename,
            pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            rightMargin=0.5 * inch
        )

        story = []

        # --- 2f. Build the PDF 'Story' ---
        
        # --- NEW: Title style is now smaller ---
        title_style = styles['h2']
        title_style.alignment = TA_CENTER
        title_style.fontSize = 12  # <-- Made font smaller (was 14)
        story.append(Paragraph(video_title, title_style)) 

        subtitle_style = styles['Normal']
        subtitle_style.alignment = TA_CENTER
        subtitle_style.fontSize = 10
        story.append(Paragraph("Please scan the QR code to access the tutorial.", subtitle_style))

        # --- NEW: Spacer is smaller ---
        story.append(Spacer(1, 0.2 * inch)) # <-- Made spacer smaller (was 0.4)

        qr_image = Image(qr_image_filename)
        qr_size_in_inches = 3
        qr_image.drawWidth = qr_size_in_inches * inch
        qr_image.drawHeight = qr_size_in_inches * inch
        qr_image.hAlign = 'CENTER'
        story.append(qr_image)

        story.append(Spacer(1, 0.2 * inch))

        url_style = styles['Normal']
        url_style.alignment = TA_CENTER
        url_style.fontSize = 9
        story.append(Paragraph(data, url_style))

        # --- 2g. Build the PDF ---
        doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)

        print(f"Final PDF '{pdf_filename}' created successfully!")
        print("-" * (18 + len(original_url)) + "\n")

    except Exception as e:
        print(f"!!! FAILED to process {original_url} !!!")
        print(f"Error: {e}\n")

print("All links processed.")