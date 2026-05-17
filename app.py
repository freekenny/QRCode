import streamlit as st
import qrcode
import re
import yt_dlp
from reportlab.lib.pagesizes import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from io import BytesIO


def clean_title_text(name):
    """Removes invalid characters and hashtags from a string."""
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace("#", "")
    return name.strip()


def create_safe_filename(name):
    """Takes a clean title, replaces spaces with underscores."""
    filename = name.replace(" ", "_")
    return filename[:100]


def draw_footer(canvas, doc):
    """Footer drawing function."""
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(
        doc.width + doc.leftMargin,
        doc.bottomMargin * 0.75,
        "LDesignMD"
    )
    canvas.restoreState()


def generate_qr_code(data):
    """Generate QR code from data."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")


def fetch_youtube_title(url):
    """Fetch YouTube video title using yt-dlp."""
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info.get('title', 'Unknown_Video_Title')
    except Exception as e:
        return None


def create_pdf_with_qr(video_title, url, qr_image):
    """Create a PDF with QR code."""
    safe_title = create_safe_filename(video_title)
    pdf_filename = f"{safe_title}.pdf"
    
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
    
    styles = getSampleStyleSheet()
    story = []
    
    title_style = styles['h2']
    title_style.alignment = TA_CENTER
    title_style.fontSize = 12
    story.append(Paragraph(video_title, title_style))
    
    subtitle_style = styles['Normal']
    subtitle_style.alignment = TA_CENTER
    subtitle_style.fontSize = 10
    story.append(Paragraph("Please scan the QR code to access the tutorial.", subtitle_style))
    
    story.append(Spacer(1, 0.2 * inch))
    
    # Save QR image temporarily
    qr_temp_path = "temp_qr.png"
    qr_image.save(qr_temp_path)
    
    qr_img_obj = Image(qr_temp_path)
    qr_size_in_inches = 3
    qr_img_obj.drawWidth = qr_size_in_inches * inch
    qr_img_obj.drawHeight = qr_size_in_inches * inch
    qr_img_obj.hAlign = 'CENTER'
    story.append(qr_img_obj)
    
    story.append(Spacer(1, 0.2 * inch))
    
    url_style = styles['Normal']
    url_style.alignment = TA_CENTER
    url_style.fontSize = 9
    story.append(Paragraph(url, url_style))
    
    # Build PDF to BytesIO
    pdf_buffer = BytesIO()
    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    
    # Read the PDF file and return as bytes
    with open(pdf_filename, 'rb') as f:
        pdf_bytes = f.read()
    
    import os
    os.remove(pdf_filename)
    if os.path.exists(qr_temp_path):
        os.remove(qr_temp_path)
    
    return pdf_bytes, safe_title


# --- Streamlit UI ---
st.set_page_config(page_title="QR Code Generator", layout="wide")
st.title("🎬 YouTube QR Code Generator")
st.write("Paste a YouTube link and generate a beautiful QR code PDF for your tutorials!")

col1, col2 = st.columns([2, 1])

with col1:
    url_input = st.text_input("📎 Paste your YouTube link here:", placeholder="https://youtu.be/...")

with col2:
    st.write("")
    st.write("")
    generate_button = st.button("🔄 Generate QR Code", use_container_width=True)

if generate_button:
    if not url_input:
        st.error("❌ Please enter a YouTube link")
    else:
        with st.spinner("⏳ Fetching video info and generating QR code..."):
            try:
                # Fetch YouTube title
                raw_title = fetch_youtube_title(url_input)
                
                if raw_title is None:
                    st.error("❌ Could not fetch video. Please check the link and try again.")
                else:
                    # Clean title
                    main_title = raw_title.split('|')[0].strip()
                    video_title = clean_title_text(main_title)
                    
                    # Generate QR code
                    qr_image = generate_qr_code(url_input)
                    
                    # Create PDF
                    pdf_bytes, safe_title = create_pdf_with_qr(video_title, url_input, qr_image)
                    
                    st.success("✅ QR Code generated successfully!")
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.subheader("📊 QR Code Preview")
                        st.image(qr_image, width=250, caption=f"QR Code for: {video_title}")
                    
                    with col2:
                        st.subheader("📋 Video Info")
                        st.write(f"**Title:** {video_title}")
                        st.write(f"**URL:** {url_input}")
                    
                    st.divider()
                    
                    # Prepare download data
                    qr_buffer = BytesIO()
                    qr_image.save(qr_buffer, format="PNG")
                    qr_png_bytes = qr_buffer.getvalue()
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.download_button(
                            label="📥 Download QR Code (PNG)",
                            data=qr_png_bytes,
                            file_name=f"{safe_title}_qr.png",
                            mime="image/png"
                        )
                    
                    with col2:
                        st.download_button(
                            label="📄 Download PDF with QR Code",
                            data=pdf_bytes,
                            file_name=f"{safe_title}.pdf",
                            mime="application/pdf"
                        )
                    
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

st.divider()
st.markdown("---")
st.write("💡 **How to use:** Simply paste a YouTube link, click 'Generate QR Code', and download your QR code as PNG or as part of a beautiful PDF tutorial sheet!")
