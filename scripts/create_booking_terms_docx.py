"""
Generate an executive, publication-grade Word document (.docx) containing the
complete Inspired Ventures Booking Terms and Conditions.
"""

import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_document():
    doc = docx.Document()

    # -------------------------------------------------------------------------
    # PAGE SETUP & SECTION PROPERTIES
    # -------------------------------------------------------------------------
    section = doc.sections[0]
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.different_first_page_header_footer = True

    # Palette
    NAVY = RGBColor(27, 54, 93)         # #1B365D - Primary headers & title
    SLATE_BLUE = RGBColor(43, 108, 176)   # #2B6CB0 - Subheadings & accents
    CHARCOAL = RGBColor(45, 55, 72)     # #2D3748 - Main body text
    MUTED = RGBColor(113, 128, 150)     # #718096 - Captions & headers
    RED = RGBColor(185, 28, 28)         # #B91C1C - Warning text

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = CHARCOAL

    # -------------------------------------------------------------------------
    # RUNNING HEADERS & FOOTERS
    # -------------------------------------------------------------------------
    # Header (Page 2 onwards)
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("INSPIRED VENTURES LTD  |  BOOKING TERMS & CONDITIONS")
    hrun.font.name = "Calibri"
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = MUTED

    pPr = hp._p.get_or_add_pPr()
    pBdr = parse_xml(f'''
        <w:pBdr {nsdecls("w")}>
            <w:bottom w:val="single" w:sz="4" w:space="4" w:color="CBD5E0"/>
        </w:pBdr>
    ''')
    pPr.append(pBdr)

    # Footer Setup Helper
    def setup_footer(footer_obj):
        fp = footer_obj.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        # Left side document reference, right side page number
        frun_left = fp.add_run("Inspired Ventures Ltd (No. 08834469) • Applicable from 1 Jan 2026\tPage ")
        frun_left.font.name = "Calibri"
        frun_left.font.size = Pt(8.5)
        frun_left.font.color.rgb = MUTED
        
        fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr1 = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        fp.add_run()._r.extend([fld1, instr1, fld2, fld3])

        frun_mid = fp.add_run(" of ")
        frun_mid.font.name = "Calibri"
        frun_mid.font.size = Pt(8.5)
        frun_mid.font.color.rgb = MUTED

        fld4 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr2 = parse_xml(r'<w:instrText %s xml:space="preserve"> NUMPAGES </w:instrText>' % nsdecls('w'))
        fld5 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld6 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        fp.add_run()._r.extend([fld4, instr2, fld5, fld6])

        # Bottom rule / top border for footer
        fpPr = fp._p.get_or_add_pPr()
        fpBdr = parse_xml(f'''
            <w:pBdr {nsdecls("w")}>
                <w:top w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/>
            </w:pBdr>
        ''')
        fpPr.append(fpBdr)

    setup_footer(section.footer)
    setup_footer(section.first_page_footer)

    # -------------------------------------------------------------------------
    # FORMATTING HELPERS
    # -------------------------------------------------------------------------
    def set_cell_shading(cell, color_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls("w")}>
                <w:top w:w="{top}" w:type="dxa"/>
                <w:bottom w:w="{bottom}" w:type="dxa"/>
                <w:left w:w="{left}" w:type="dxa"/>
                <w:right w:w="{right}" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)

    def add_callout(title, paragraphs, border_color="1B365D", bg_color="F7FAFC", title_color=NAVY):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=160)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="none"/>
                <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(4)
        crun = cp.add_run(title)
        crun.font.name = "Calibri"
        crun.font.size = Pt(10.5)
        crun.font.bold = True
        crun.font.color.rgb = title_color

        for item in paragraphs:
            p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(item)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.color.rgb = CHARCOAL

        spacer = doc.add_paragraph()
        spacer.paragraph_format.space_before = Pt(0)
        spacer.paragraph_format.space_after = Pt(4)

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = NAVY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = SLATE_BLUE
        return p

    def add_clause(num_str, body_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        
        # Hanging indent so that clause text lines up neatly
        p.paragraph_format.left_indent = Inches(0.40)
        p.paragraph_format.first_line_indent = Inches(-0.40)

        r_num = p.add_run(num_str + "\t")
        r_num.font.name = "Calibri"
        r_num.font.size = Pt(10)
        r_num.font.bold = True
        r_num.font.color.rgb = NAVY

        r_body = p.add_run(body_text)
        r_body.font.name = "Calibri"
        r_body.font.size = Pt(10)
        r_body.font.color.rgb = CHARCOAL
        return p

    def add_bullet(text, level=1, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        
        indent = 0.35 if level == 1 else 0.60
        p.paragraph_format.left_indent = Inches(indent)
        p.paragraph_format.first_line_indent = Inches(-0.18)
        
        bullet_char = "•\t" if level == 1 else "–\t"
        r_bullet = p.add_run(bullet_char)
        r_bullet.font.name = "Calibri"
        r_bullet.font.bold = True
        r_bullet.font.color.rgb = SLATE_BLUE
        
        if bold_prefix:
            r_prefix = p.add_run(bold_prefix + " ")
            r_prefix.font.name = "Calibri"
            r_prefix.font.bold = True
            r_prefix.font.color.rgb = CHARCOAL
            
        r_body = p.add_run(text)
        r_body.font.name = "Calibri"
        r_body.font.size = Pt(9.8)
        r_body.font.color.rgb = CHARCOAL
        return p

    def add_sublist_item(char_prefix, text, level=1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(1.5)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.15
        
        indent = 0.40 if level == 1 else 0.65
        p.paragraph_format.left_indent = Inches(indent)
        p.paragraph_format.first_line_indent = Inches(-0.25)
        
        r_pre = p.add_run(f"{char_prefix}\t")
        r_pre.font.name = "Calibri"
        r_pre.font.bold = True
        r_pre.font.color.rgb = SLATE_BLUE

        r_body = p.add_run(text)
        r_body.font.name = "Calibri"
        r_body.font.size = Pt(9.8)
        r_body.font.color.rgb = CHARCOAL
        return p

    def format_table(tbl, col_widths, headers, data, align_right_cols=[]):
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Header Row
        hdr_cells = tbl.rows[0].cells
        for i, h_text in enumerate(headers):
            cell = hdr_cells[i]
            cell.width = Inches(col_widths[i])
            set_cell_shading(cell, "1B365D")
            set_cell_margins(cell, top=90, bottom=90, left=110, right=110)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            if i in align_right_cols:
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.add_run(h_text)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row_data in enumerate(data):
            row_cells = tbl.add_row().cells
            bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cell = row_cells[c_idx]
                cell.width = Inches(col_widths[c_idx])
                set_cell_shading(cell, bg_col)
                set_cell_margins(cell, top=75, bottom=75, left=110, right=110)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                if c_idx in align_right_cols:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                run = p.add_run(val)
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = CHARCOAL

        # Set borders
        tblPr = tbl._tbl.tblPr
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="1B365D"/>
                <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:insideV w:val="none"/>
                <w:left w:val="none"/>
                <w:right w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr.append(borders)

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # DOCUMENT COVER HEADER & METADATA
    # -------------------------------------------------------------------------
    p_comp = doc.add_paragraph()
    p_comp.paragraph_format.space_before = Pt(0)
    p_comp.paragraph_format.space_after = Pt(2)
    r_comp = p_comp.add_run("INSPIRED VENTURES LIMITED")
    r_comp.font.name = "Calibri"
    r_comp.font.size = Pt(11)
    r_comp.font.bold = True
    r_comp.font.color.rgb = SLATE_BLUE

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("Booking Terms and Conditions")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = NAVY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("These Terms and Conditions are applicable to all bookings made on or after January 1st, 2026.")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(10.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = CHARCOAL

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_before = Pt(0)
    p_intro.paragraph_format.space_after = Pt(8)
    r_intro = p_intro.add_run("Please read the full terms below for information about your rights and obligations as laid out below.")
    r_intro.font.name = "Calibri"
    r_intro.font.size = Pt(10)
    r_intro.font.italic = True
    r_intro.font.color.rgb = MUTED

    # Top Metadata Card
    card_tbl = doc.add_table(rows=1, cols=2)
    card_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    card_tbl.autofit = False
    card_tbl.columns[0].width = Inches(3.25)
    card_tbl.columns[1].width = Inches(3.25)
    
    c0 = card_tbl.cell(0, 0)
    c1 = card_tbl.cell(0, 1)
    c0.width = Inches(3.25)
    c1.width = Inches(3.25)
    set_cell_shading(c0, "F0F4F8")
    set_cell_shading(c1, "F0F4F8")
    set_cell_margins(c0, top=110, bottom=110, left=130, right=130)
    set_cell_margins(c1, top=110, bottom=110, left=130, right=130)

    p_c0 = c0.paragraphs[0]
    p_c0.paragraph_format.space_before = Pt(0)
    p_c0.paragraph_format.space_after = Pt(0)
    p_c0.paragraph_format.line_spacing = 1.2
    
    r = p_c0.add_run("Corporate & Legal Entity\n")
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = NAVY
    r = p_c0.add_run("Operator: Inspired Ventures Ltd\nCompany Reg No: 08834469 (England & Wales)\nRegistered Office: 2 Faraday Lodge, Badgers Holt,\nTunbridge Wells, Kent, TN2 3DX, UK\nLegal Protection: Package Travel Regulations 2018")
    r.font.size = Pt(8.5)
    r.font.color.rgb = CHARCOAL

    p_c1 = c1.paragraphs[0]
    p_c1.paragraph_format.space_before = Pt(0)
    p_c1.paragraph_format.space_after = Pt(0)
    p_c1.paragraph_format.line_spacing = 1.2
    r = p_c1.add_run("Operations & Booking Systems\n")
    r.font.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = NAVY
    r = p_c1.add_run("Booking & Payment System: WeTravel Platform\nMobile App & Digital Itinerary: Vamoos\nCustomer Support: info@inspiredventures.co.uk\nBooking Enquiries: booking@loveherwild.com\nJurisdiction: Courts of England and Wales")
    r.font.size = Pt(8.5)
    r.font.color.rgb = CHARCOAL

    tblPr = card_tbl._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="12" w:space="0" w:color="1B365D"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
            <w:insideH w:val="none"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E0"/>
            <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E0"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # 1. OUR DETAILS
    # -------------------------------------------------------------------------
    add_heading_1("1. Our details")
    add_clause(
        "1.1",
        "Your booking is with Inspired Ventures Ltd with registered number 08834469 and registered address at 2 Faraday Lodge, Badgers Holt, Tunbridge Wells, Kent, United Kingdom TN2 3DX (“the Parent Company”, “we”, “us”, the “Company”, or “our”)."
    )

    # -------------------------------------------------------------------------
    # 2. PROTECTING YOUR MONEY
    # -------------------------------------------------------------------------
    add_heading_1("2. Protecting your money")
    add_clause(
        "2.1",
        "The combination of travel services offered to you is a package holiday within the meaning of the Package Travel and Linked Travel Arrangements Regulations 2018. Therefore, you will benefit from all rights applying to packages and detailed within the regulations. We will be responsible for the proper performance of all the travel services included in the package."
    )
    add_clause(
        "2.2",
        "In addition to the rights afforded under the Package Travel and Linked Travel Arrangements Regulations 2018, you are covered for operator financial failure regardless of where you are located through the Parent Company and the relevant insurance policies in effect."
    )

    # -------------------------------------------------------------------------
    # 3. YOUR HOLIDAY BOOKING
    # -------------------------------------------------------------------------
    add_heading_1("3. Your holiday booking")
    add_clause(
        "3.1",
        "A booking will exist as soon as we issue our booking confirmation email (the “Booking Confirmation”). This booking is made on the terms of these booking conditions as detailed below."
    )
    add_clause(
        "3.2",
        "The person making the booking (the “lead name”) must be 18 years old or over, and when you make a booking, you guarantee that you have the authority to accept and do accept on behalf of you and/or your party the terms of these booking conditions."
    )
    add_clause(
        "3.3",
        "We will confirm your booking once you have completed the required information on our online booking platform WeTravel and paid the required deposit. If for any reason we are unable to accept your booking, we will notify you within 14 days and provide an immediate return of your deposit money."
    )
    add_clause(
        "3.4",
        "Bookings are accepted on an individual or group basis. A booking is considered a group where 2 or more customers are named on the booking. When a group booking is made, we will only deal with the lead passenger (also known as the buyer) in all subsequent correspondence, including Vamoos log-in details, changes, amendments, and cancellations. On receipt of the booking confirmation, the customer or lead passenger is responsible for ensuring the accuracy of the information recorded and editing those details on WeTravel or contacting us to make the necessary changes. The lead passenger in a group booking is also responsible for sharing the log-in details for the Vamoos app with the other travellers in that group."
    )
    add_clause(
        "3.5",
        "Once your booking is received and confirmed, you will receive an automated e-mail from Inspired Ventures Limited (the Parent Company) containing the details that will enable you to sign into Vamoos. This is an app that can be added to your phone and contains your full itinerary, arrival and departure details, packing list, important contact numbers, and all the other information relating to your trip. This clearly identifies what elements of your tour are included and excluded."
    )
    add_clause(
        "3.6",
        "Although international flights will not typically form part of your booking, there are occasions when domestic or regional flights are part of the package. A copy of the front page of your passport will be required in these instances to allow flights to be booked by us or our local partner/ground supplier. You are required to upload this to the Participant Information section of WeTravel after booking or when requested to do so. Unless we are responsible for any mistake, we will not accept liability if an airline or other supplier refuses boarding because the name(s) shown on your passport differ from those on your ticket."
    )
    add_clause(
        "3.7",
        "All clients are expected to satisfy themselves prior to booking that they are fit and able to complete the itinerary of their chosen holiday as described on our website and detailed in Vamoos for your trip. By booking a tour with us, you acknowledge that this is an active holiday which may test your physical ability and may consist of strenuous and demanding activities, including work carried out during the volunteering/give back portion of the tour. You are therefore responsible for ensuring you are aware of the nature of the associated activities and physical requirements before you book."
    )
    add_clause(
        "3.8",
        "By confirming your booking, you acknowledge that you have the appropriate levels of ability, fitness, and good health to safely participate in all aspects of the tour itinerary. Your personal safety is of paramount importance to us, and therefore it is imperative that you advise us at the time of booking of any condition, medical or otherwise, that might affect your or other people’s enjoyment of the trip. This should include, but not be limited to, any special dietary requirements (including, for example, allergies) and any reduced mobility affecting you or members of your booking."
    )
    add_clause(
        "3.9",
        "Should we deem it necessary in respect of certain activities included in the tour itinerary, we may request that you undergo a full health check and produce a medical certificate in respect of such health check no later than 8 weeks prior to your trip’s scheduled start date."
    )
    add_clause(
        "3.10",
        "If you are booking a trip where you will be working with children or other vulnerable persons and a police check is required, you are responsible for the application, payment, and production of the police or other agency certificate relevant to your country of residence. When this relates to a tour that you have booked, you will find details of the requirements on Vamoos and on our website. If you fail to provide the acceptable documentation, your booking will be cancelled, and your full payment minus the deposit will be refunded."
    )
    add_clause(
        "3.11",
        "Please contact us by email at booking@loveherwild.com and info@inspiredventures.co.uk to discuss any such requirements."
    )
    add_clause(
        "3.12",
        "All prices we advertise are accurate at the date published, but we reserve the right to change any of those prices because of exchange rate fluctuations exceeding 8%. In the unlikely event of an administrative error leading to an incorrect price being displayed, we reserve the right to correct it (including after a booking has been confirmed). Offers are not combinable unless expressly stated and may be withdrawn at any time. Before you make a booking, the up-to-date price of your chosen holiday, including the cost of any supplements, upgrades, or additional facilities which you have requested, will be clearly displayed before check-out on the WeTravel online booking system."
    )
    add_clause(
        "3.13",
        "We reserve the right to refuse a booking in accordance with the guidelines laid out in Clause 15 of this document. Unacceptable behaviour will not be tolerated and will result in a refusal of future bookings. (Note: Clause reference confirmed as Clause 15 'Conduct')."
    )

    # -------------------------------------------------------------------------
    # 4. PAYING FOR YOUR HOLIDAY
    # -------------------------------------------------------------------------
    add_heading_1("4. Paying for Your Holiday")
    add_clause(
        "4.1",
        "When you make your booking, you must pay the non-refundable deposit as stated with the submission of your booking form (generally, this is at least 10% per person of the price of your selected travel itinerary or a minimum of £500 per person or equivalent)."
    )
    add_clause(
        "4.2",
        "The balance of the price of your travel arrangements (calculated after the deduction of your deposit and any instalment payments) must be paid in line with your deposit payment schedule."
    )
    add_clause(
        "4.3",
        "In certain cases, we may request full or partial payment more than 120 days before departure where, for example, overseas suppliers require full or partial payment on booking. If the deposit and/or balance is not paid in time, we reserve the right to cancel your travel arrangements. If the balance is not paid in time, we shall retain your deposit and cancel your booking."
    )
    add_clause(
        "4.4",
        "You may be required to pay further in advance for any non-transferable and non-refundable items such as National Park entrance fees and permits, and in some cases for accommodation and services at peak times of travel or where accommodation and spaces are limited. You will be advised of all such charges due at the time of booking and before your trip is confirmed. You may also be required to pay for any non-transferable and non-refundable items, such as special domestic airfares, tickets, or entry permits, and any other applicable supplements due, at the time of booking, and they may be non-refundable in the event of cancellation."
    )

    # -------------------------------------------------------------------------
    # 5. TRAVEL INSURANCE
    # -------------------------------------------------------------------------
    add_heading_1("5. Travel Insurance")
    add_clause(
        "5.1",
        "Adequate and valid travel insurance for your chosen itinerary is compulsory for all travellers, and it is a condition of accepting your booking that you agree you will have obtained adequate and valid travel insurance. We recommend you take out insurance as soon as your booking is made and confirmed. You are strongly advised to insure yourself against any possible risk that may occur, including force majeure. (See Clause 19)."
    )
    add_clause(
        "5.2",
        "We also recommend you are insured for unforeseen emergencies like death or serious illness, helping with cancellation or interruption costs for eligible relatives, but the definition of \"relative\" (e.g., parents, in-laws, cousins) varies by insurer, so always check your policy's definition, and cover may be void if the condition was pre-existing or expected. You will be required to upload details of your insurance policy to our WeTravel booking platform in advance of your date of departure."
    )
    add_clause(
        "5.3",
        "Your insurance should also include cover against COVID-19 and other health-related incidents which may affect or curtail your booking."
    )
    add_clause(
        "5.4",
        "You are responsible for ensuring that you are in possession of travel insurance for the entire duration of the tour in respect of at least medical expenses, medical evacuation, injury, death, repatriation, cancellation, and curtailment."
    )
    add_clause(
        "5.5",
        "You must ensure that there are no exclusion clauses which limit cover for the type of activities included in your travel arrangements as detailed in Vamoos, or the altitudes attained, in your tour. We will not be responsible for costs you may incur as a result of not having valid or adequate travel insurance. It is the responsibility of all our clients to declare any material facts, including known medical conditions, to their insurers, as failure to do so may result in a claim being reduced or declined."
    )

    # -------------------------------------------------------------------------
    # 6. CONFIRMATION OF YOUR TRAVEL ARRANGEMENTS
    # -------------------------------------------------------------------------
    add_heading_1("6. Confirmation of your travel arrangements")
    add_clause(
        "6.1",
        "The majority of our travel itineraries require a specific number of passengers to book onto them to reach the minimum numbers before they are confirmed to operate. You will be made aware of this at the time of booking, and once this threshold has been met, we will notify you that your travel arrangements are confirmed and that you can proceed with booking flights or making other necessary arrangements."
    )
    add_clause(
        "6.2",
        "We strongly recommend that you make no travel arrangements to your point of departure, make any connecting travel that is non-refundable or non-changeable or incurs penalties, or incur any costs in respect of visas or vaccinations until such time as your travel itinerary has been confirmed by us in writing, either by e-mail or by an update on the Vamoos app."
    )
    add_clause(
        "6.3",
        "If you make such arrangements which you are then unable to use due to a change in your itinerary, we shall not be liable to you for the cost of those arrangements."
    )

    # -------------------------------------------------------------------------
    # 7. IF YOU CANCEL YOUR BOOKING
    # -------------------------------------------------------------------------
    add_heading_1("7. If You Cancel Your Booking")
    add_clause(
        "7.1",
        "If you cancel (or any member of your party cancels) some or all portions of your booking, the cancellation terms set out below will apply. Written notification from you or the lead name on the booking must be received by email at the following addresses: info@inspiredventures.co.uk and booking@loveherwild.com."
    )
    add_clause(
        "7.2",
        "A cancellation will only be effective once we have received written confirmation from you that you wish to cancel."
    )
    add_clause(
        "7.3",
        "The deposit and all other payments for the trip that we have received from you will be put towards the cancellation fees detailed below. In the event that you do cancel your booking, and the amount you have already paid does not cover the cancellation fees set out below, you must pay any difference between the amount you have paid and the cancellation fee applied. By accepting these Booking Conditions, you give your authority for us to automatically charge the payment card used by you when securing the booking (or any other card used by you in connection with this booking) at the time."
    )
    add_clause(
        "7.4",
        "If you cancel a trip, the following conditions apply:"
    )
    add_bullet(
        "More than 120 days prior to departure, your deposit is non-refundable, and the remainder of the fees that you have paid will be refunded unless non-refundable payments to suppliers have been made.** Transfers are not permitted.",
        level=1
    )
    add_bullet(
        "Less than 120 days prior to departure, your deposit and instalment payments are non-refundable (alongside any unpaid balance that remains due at the time of cancellation). Transfers within this period are not permitted.",
        level=1
    )
    add_bullet(
        "** Please be aware that different cancellation conditions apply to some trips where additional non-refundable payments are required to be paid by us to our partners in-country (such as trekking permits or internal flights). You will be made aware of these at the time of booking.",
        level=1
    )

    cancel_headers = ["Cancellation Period", "Deposit Status", "Fees & Balances", "Transfers"]
    cancel_rows = [
        [
            "> 120 days prior to departure",
            "Non-refundable (retained)",
            "Remainder refunded (less non-refundable supplier costs)**",
            "Not permitted"
        ],
        [
            "< 120 days prior to departure",
            "Non-refundable (retained)",
            "All instalments non-refundable; full balance remains due",
            "Not permitted"
        ]
    ]
    t_can = doc.add_table(rows=1, cols=4)
    format_table(t_can, [2.1, 1.4, 2.0, 1.0], cancel_headers, cancel_rows)

    add_clause(
        "7.5",
        "Travel insurance is compulsory for your trip, and, in addition, you are strongly advised to take out cancellation insurance at the time of your booking. If the reason for your cancellation is covered under the terms of your insurance policy, you may be able to reclaim these charges; as stated, certain travel arrangements are non-refundable and are subject to higher cancellation charges and could incur a cancellation charge of up to 100% of that part of the arrangements from the moment the booking is confirmed."
    )
    add_clause(
        "7.6",
        "If you leave a trip for any reason after it has commenced (other than where we cancel it for operational reasons), we are not obliged to make any refunds for unused services. If you fail to join a trip, join it after departure, or leave it prior to its completion, no refund will be made for unused services."
    )

    # -------------------------------------------------------------------------
    # 8. IF YOU CHANGE YOUR BOOKING
    # -------------------------------------------------------------------------
    add_heading_1("8. If You Change Your Booking")
    add_clause(
        "8.1",
        "If, after our Booking Confirmation has been issued, you wish to change your travel arrangements in any way, for example, your chosen departure date or accommodation, we will do our utmost to make these changes, but it may not always be possible. Any request for changes to be made must be in writing from you or the lead name. You may be asked to pay an administration charge of £50 or equivalent, and any further costs we incur in making this alteration (including those charged by third-party suppliers who provide the component parts of your booking). You should be aware that these costs could increase the closer to the departure date that changes are made, and you should contact us as soon as possible."
    )
    add_clause(
        "8.2",
        "Certain travel arrangements may not be changeable after a reservation has been made, and any alteration request could incur a cancellation charge of up to 100% of that part of the arrangements."
    )
    add_clause(
        "8.3",
        "Please bear in mind that certain airlines and other transport providers treat changes as a cancellation and charge accordingly, up to 100% of the cost for that part of the arrangement. Where applicable, these charges will be passed on to you."
    )
    add_clause(
        "8.4",
        "(Section intentionally skipped as it was omitted in original text)."
    )
    add_clause(
        "8.5",
        "If you leave your trip/experience before the specified trip end date, other than as a result of our breach of this Agreement, no refund will be made to you."
    )

    # -------------------------------------------------------------------------
    # 9. IF WE CANCEL YOUR BOOKING
    # -------------------------------------------------------------------------
    add_heading_1("9. If We Cancel Your Booking")
    add_clause(
        "9.1",
        "We reserve the right to cancel your booking. We will not cancel less than 4 weeks before your booking start date, except for unavoidable and extraordinary circumstances, or failure by you to pay the deposit and/or final balance, or because the minimum number required for the trip to go ahead hasn’t been reached."
    )
    add_clause(
        "9.2",
        "The minimum number of passengers required for your trip will be provided to you in the Vamoos app for your trip and/or on the relevant webpage. If the minimum number had been reached, but we experience late cancellations by other clients which means that the minimum number is no longer met, we reserve the right to cancel a tour 20 days before the start of the package."
    )
    add_clause(
        "9.3",
        "If your trip is cancelled by us, you can either have a refund of all monies paid or accept an alternative holiday of comparable standard from us if we offer one (we will refund any price difference if the alternative is of a lower value)."
    )
    add_clause(
        "9.4",
        "In the event a refund is paid to you, we will:"
    )
    add_bullet("Pay compensation as detailed below, except where the cancellation is due to unavoidable and extraordinary circumstances.", level=1)
    add_bullet("Where notified before the balance due date, no compensation will be paid.", level=1)
    add_bullet("Where notified between the balance due date and 14 days before the departure date (inclusive), £20 will be paid to you by Inspired Ventures Limited.", level=1)
    add_bullet("Where notified between 13 days and the date of departure (inclusive), £30 will be paid to you by Inspired Ventures Limited.", level=1)
    add_bullet("This does not preclude you claiming more if you are legally entitled to do so.", level=1)

    # -------------------------------------------------------------------------
    # 10. IF WE CHANGE YOUR BOOKING
    # -------------------------------------------------------------------------
    add_heading_1("10. If We Change Your Booking")
    add_heading_2("10.1 Changes to the price")
    add_clause(
        "10.1.1",
        "We reserve the right to change your holiday price after you’ve booked; however, this only applies in certain circumstances:"
    )
    add_clause(
        "10.1.2",
        "Changes in the price of the carriage of passengers resulting from changes to the cost of fuel or other power sources, the level of taxes or fees imposed by third parties including tourist taxes, landing taxes or embarkation or disembarkation fees at ports and airports, or exchange rates mean that the price of your travel arrangements may change after you have booked. However, there will be no change within 30 days of your start date."
    )
    add_clause(
        "10.1.3",
        "We will absorb, and you will not be charged for, any increase equivalent to 2% of the price of your travel arrangements. You will be charged for the amount over and above that. If this results in an increase equivalent to more than 8% of the price of your travel arrangements, you will have the option of accepting a change to another holiday if we are able to offer one (we will refund any price difference if the alternative is of a lower value), or cancelling and receiving a full refund of all monies paid, except for any amendment charges. Should you decide to cancel, you must do so within the time period shown on your WeTravel payment schedule."
    )
    add_clause(
        "10.1.4",
        "Should the price of your holiday go down due to the cost changes mentioned above, then any refund due will be paid to you. We will deduct from this refund our administrative expenses incurred. Please note that travel arrangements are not always purchased in local currency, and some apparent changes have no impact on the price of your travel due to contractual and other protection in place."
    )

    add_heading_2("10.2 Changes other than the price")
    add_clause(
        "10.2.1",
        "It is a term of your booking that we are able to make changes to any aspect of your booking. If the change is insignificant, we will ensure that you are notified about it. Examples of insignificant changes include: a change of accommodation to another of the same or higher standard, changes of carriers, or a change in the order of the itinerary."
    )
    add_clause(
        "10.2.2",
        "We may include a contingency start date for all of our trips, which will be confirmed to you at the time of booking. By agreeing to these terms and conditions, you are accepting your trip start date may be moved to the stated contingency date, and therefore such a change is not defined as significant."
    )
    add_clause(
        "10.2.3",
        "If we are forced by circumstances beyond our control to alter significantly any of the main characteristics of the travel services that make up your package, you will have the rights set out below:"
    )
    add_sublist_item(
        "1.",
        "We will contact you, and you will have the choice of accepting the change or having a refund of all monies paid. You can also accept an alternative holiday, where we offer one (we will refund any price difference if the alternative is of a lower value). We will tell you the procedure for making your choice. Please read any notification of changes carefully and respond promptly; if you do not respond to us within the timescale given, your booking may be cancelled.",
        level=1
    )
    add_sublist_item(
        "2.",
        "If you choose to accept a refund, we will pay compensation as detailed below, except where the significant change is due to unavoidable and extraordinary circumstances, which means a situation beyond our control, the consequences of which could not have been avoided even if all reasonable measures had been taken:",
        level=1
    )
    add_bullet("Where notified before the balance date, no compensation will be paid.", level=2)
    add_bullet("Where notified between the balance due date and 14 days before the departure date (inclusive), £20 will be paid to you by Inspired Ventures Limited.", level=2)
    add_bullet("Where notified between 13 days and the date of departure (inclusive), £30 will be paid to you by Inspired Ventures Limited.", level=2)
    add_clause(
        "10.2.4",
        "The compensation that we offer does not exclude you from claiming more if you are entitled to do so."
    )

    # Compensation Table
    comp_headers = ["Cancellation / Change Notification Window", "Compensation Payable per Person", "Applicability"]
    comp_rows = [
        ["Prior to balance due date", "£0.00 (Nil)", "Standard cancellation/change; full refund of monies paid"],
        ["Between balance due date and 14 days prior (inclusive)", "£20.00", "Paid by Inspired Ventures Ltd (unless extraordinary circumstances)"],
        ["Between 13 days and date of departure (inclusive)", "£30.00", "Paid by Inspired Ventures Ltd; does not preclude legal claims"]
    ]
    t_cmp = doc.add_table(rows=1, cols=3)
    format_table(t_cmp, [2.5, 1.8, 2.2], comp_headers, comp_rows)

    # -------------------------------------------------------------------------
    # 11. OUR LIABILITY TO YOU
    # -------------------------------------------------------------------------
    add_heading_1("11. Our Liability to You")
    add_clause(
        "11.1",
        "You must inform us without undue delay of any failure to perform or improper performance of the travel services included in this package. If any of the travel services included in your package are not performed in accordance with these booking conditions, or are improperly performed, by us or the travel service suppliers, and this has affected the enjoyment of your travel arrangements, you may be entitled to an appropriate price reduction or compensation, or both."
    )
    add_clause(
        "11.2",
        "We will not be liable where any failure to perform or improper performance of the travel services is due to (i) you or another member of your party; (ii) a third party unconnected with the provision of the travel services in the package and is unforeseeable or unavoidable; or (iii) unavoidable and extraordinary circumstances."
    )
    add_clause(
        "11.3",
        "Our liability, except in cases involving death, injury, or illness, shall be limited to a maximum of three times the cost of your travel arrangements. Our liability will also be limited in accordance with and/or in an identical manner to the following:"
    )
    add_sublist_item(
        "1.",
        "You agree that any transport company’s (or other supplier’s) own ‘Conditions of Carriage’ will apply to you on any journey by road, rail, sea, or air. When arranging this transportation for you, we rely on the terms and conditions contained within these international conventions and those ‘Conditions of Carriage’. You acknowledge that all of these terms and conditions form part of your contract with us as well as with the transport company. You can ask us or the travel organiser booking your holiday to provide you with a copy of any of the conditions applicable to your journey. The airline’s terms and conditions are available on request. We will tell you the identity of the air carrier when you book with us, and if it is not known at that time or subsequently changes, we will inform you as soon as possible and no later than at check-in for your flight; and",
        level=1
    )
    add_sublist_item(
        "2.",
        "Any relevant international convention, for example, the Montreal Convention in respect of travel by air, the Athens Convention in respect of travel by sea, the Berne Convention in respect of travel by rail, and the Paris Convention in respect of the provision of accommodation, which limit the amount of and conditions under which compensation can be claimed for death, injury, delay to passengers, and loss, damage, and delay to luggage. We are to be regarded as having all the benefit of any limitation of the extent of or the conditions under which compensation is to be paid under these or any conventions.",
        level=1
    )
    add_clause(
        "11.4",
        "If you are joining a guided holiday locally or arriving prior to the scheduled start date of the trip, our responsibility does not commence until the appointed start time. We shall not be responsible for any additional expenses incurred by you to meet up with the group."
    )
    add_clause(
        "11.5",
        "For flights departing from the EU, under EU law (Regulation 261/2004), you have rights in some circumstances to refunds and/or compensation from your airline in cases of denied boarding, cancellation, or delay to flights. Full details will be publicised at EU airports and available from airlines. However, reimbursement in such cases will not automatically entitle you to a refund of your holiday cost from us. Your right to a refund and/or compensation from us is set out in these booking conditions."
    )
    add_clause(
        "11.6",
        "If it is impossible to ensure your return as scheduled due to unavoidable and extraordinary circumstances, we will bear the cost of necessary accommodation, if possible of equivalent category, for a maximum of three nights. The limit doesn’t apply to persons with reduced mobility and any person accompanying them, or persons in need of specific medical assistance, provided that you notified us of these needs at least 48 hours before the start of your holiday."
    )

    # Callout: Adventure Travel Note
    add_callout(
        "Adventure Travel Note & Acceptance of Hazards",
        [
            "Local Infrastructure & Operational Realities: We may operate trips in regions where standards of accommodation, transport, safety, hygiene, medical facilities, and other infrastructure may, at times, be lower than those you normally expect and will vary throughout the trip. Your booking is accepted on the understanding that you realise the hazards involved in this kind of holiday, including injury, disease, loss or damage to property, inconvenience, and discomfort. The suppliers of the services and facilities included in your holiday should comply with local standards where they are provided.",
            "Philosophy of Active Travel & Flexible Itineraries: The whole philosophy of this type of travel is one that accepts alternatives and a substantial degree of on-trip flexibility. The outline itineraries given for each holiday must therefore be taken as an indication of what each group should accomplish, and not as a contractual obligation on our part. Changes in itinerary may be caused by local political conditions, flight cancellations, mechanical breakdown, weather, border restrictions, animal sightings, sickness, or other unforeseeable circumstances. Pro-rata refunds will be given for services not utilised wherever possible. Please note that the timings of air, sea, road, or rail departures are estimates only. These timings may be affected by operational difficulties, weather conditions, or the failure of passengers to check in on time.",
            "Safety Priorities & Acceptance of Risk Form: Please be assured that our service providers will always do their utmost to ensure your safety and well-being when on tour. On certain tours, our local service providers will, on day 1 of the tour, ask you to sign an ‘Acceptance of Risk’ form prior to accepting your participation in the tour."
        ],
        border_color="2B6CB0",
        bg_color="F0F4F8",
        title_color=SLATE_BLUE
    )

    add_clause(
        "11.7",
        "Note: this entire clause does not apply to any separate contracts that you may enter into directly for excursions or activities whilst on the tour, for which liability rests with the excursion provider and not us."
    )
    add_clause(
        "11.8",
        "By agreeing to these booking terms and conditions, you accept that all sports and travel carry some risk of personal injury. You have the right to refuse the taking of any risks which you believe may endanger your health and safety, or which are not covered by your insurance. You agree that we will not be held liable for any injury or damage caused to you where you have taken a risk willingly, and the injury or damage arose other than as a result of our negligence."
    )

    # -------------------------------------------------------------------------
    # 12. COMPLAINTS PROCEDURE
    # -------------------------------------------------------------------------
    add_heading_1("12. Complaints Procedure")
    add_clause(
        "12.1",
        "If you have a complaint about any of the services included in your holiday and/or need assistance whilst away, you must inform your Tour Leader or Host, where applicable, without undue delay, who will endeavour to put things right."
    )
    add_clause(
        "12.2",
        "If your issue is not resolved locally, please email our Customer Services team at info@inspiredventures.co.uk or booking@loveherwild.com, and include a description of the issue you are experiencing and any steps that may have been taken to resolve it."
    )
    add_clause(
        "12.3",
        "If it is not resolved locally, please follow this up within 28 days of the end of the tour by writing to our Customer Services Department at info@inspiredventures.co.uk and booking@loveherwild.com, giving your tour date and destination and all other relevant information. If you fail to follow the requirement to report your complaint while on your trip, we will have been deprived of the opportunity to investigate and rectify it, and this may affect your rights under this booking."
    )
    add_clause(
        "12.4",
        "Your complaint will be reviewed by our Customer Service Team, and if necessary, it will be escalated to the CEO of Inspired Ventures Limited, whose decision in the matter will be final."
    )

    # -------------------------------------------------------------------------
    # 13. ADDITIONAL ASSISTANCE WHILE ON TOUR
    # -------------------------------------------------------------------------
    add_heading_1("13. Additional assistance while on tour")
    add_clause(
        "13.1",
        "If you are in difficulty whilst on holiday and ask us to help, we will provide appropriate assistance, in particular by providing information on health services, local authorities, and consular assistance, and helping you to find alternative arrangements and any necessary phone calls/emails. You must pay any costs we incur if the difficulty is your fault."
    )
    add_clause(
        "13.2",
        "Should we, in case of an emergency, provide you with any financial support, you are obliged to reimburse all monies given to you by us within 4 weeks of the trip end date. The provision of such financial support is entirely at our discretion."
    )

    # -------------------------------------------------------------------------
    # 14. PASSPORT, VISA, HEALTH, TRAVEL, AND IMMIGRATION REQUIREMENTS
    # -------------------------------------------------------------------------
    add_heading_1("14. Passport, Visa, Health, Travel, and Immigration Requirements")
    add_clause(
        "14.1",
        "Your specific passport and visa requirements, and other immigration requirements are your responsibility, and you should confirm these with the relevant Embassies, Consulates, or official websites of the country you are visiting. We do not accept any responsibility if you cannot travel because you have not complied with any passport, visa, or immigration requirements. General guidance can be found on the Vamoos app for your trip, but it is your sole responsibility to check that you have followed the appropriate steps to obtain entry to another country."
    )
    add_clause(
        "14.2",
        "Please note that for some trips we need to request special permits, and as such, we will require your passport details prior to accepting your booking. Furthermore, if you renew your passport after you have booked, you may be required to take your old passport with you to maintain the validity of the permit."
    )
    add_clause(
        "14.3",
        "We are able to advise on mandatory health requirements; however, we are not medical experts. It is your responsibility to ensure that you obtain proper and detailed medical advice at least 2 months prior to travel for the latest health requirements, recommendations for your destination, and any costs. You should check this information at least 2 months before departure and again within 14 days of travel."
    )
    add_clause(
        "14.4",
        "Where you do not do so and either are not allowed to enter any country, or suffer personal injury or death as a result, we have no liability to you for any cost, loss, or damage which you suffer, nor will we refund you the cost of any unused portion of your travel arrangements. Clients with existing medical problems, pregnant women, and anyone who has recently visited other countries should check requirements with their medical professional or travel clinic."
    )
    add_clause(
        "14.5",
        "When assessing whether holidays will operate, we use information from our local offices in conjunction with advice from the UK Foreign, Commonwealth & Development Office (FCDO), the US Department of State, and other relevant government bodies. It is your responsibility to acquaint yourself with the travel advice provided by these government bodies. For more information, please visit the government websites included in the footnotes. It is advisable to register your travel plans with the relevant government bodies that provide travel alerts and updates. These details can be found on the websites noted below."
    )
    add_clause(
        "14.6",
        "Laws and customs of the country or countries you visit can be vastly different to those in your home country. Your local tour operator will provide a briefing prior to the commencement of your trip outlining customs, laws, and behaviours that you need to be aware of. Remain conscious of your actions to ensure that they do not offend, especially if you intend to visit religious areas, sacred sites, or memorials. There may be serious penalties for doing something that might not be illegal elsewhere. It is your responsibility to familiarise yourself with, and respect, local laws and customs."
    )

    # -------------------------------------------------------------------------
    # 15. CONDUCT
    # -------------------------------------------------------------------------
    add_heading_1("15. Conduct")
    add_clause(
        "15.1",
        "We reserve the right to refuse to accept you as a customer or continue dealing with you if we, or another person in authority, believe your behaviour is disruptive, causes unnecessary inconvenience, is threatening or abusive, you damage property, you upset, annoy, disturb, or put any other traveller or our staff or agents on a tour in any risk or danger, on the telephone, in writing, or in person."
    )
    add_clause(
        "15.2",
        "On an active group holiday, it is necessary that you abide by the authority of the leader, who represents the Company. If you commit any illegal act when travelling with us, or if in our reasonable opinion or the reasonable opinion of the leader or another person in authority, your behaviour is disruptive, threatening, or abusive, causes unnecessary inconvenience, impacts on other clients’ enjoyment of the trip, or is causing or likely to cause damage to property, danger, distress, or upset, disturbance, or annoyance to others, or puts any other traveller or our staff in any risk or danger, on the telephone, in writing, or in person, we may terminate your travel arrangements without any liability on our part."
    )
    add_clause(
        "15.3",
        "By confirming your booking, you accept that you will adhere to our Code of Conduct detailed in Appendix 1 and that the Company’s tour leaders have the authority to prevent you from participating in any part of a tour should they have concerns about (a) your ability to safely partake in an activity or (b) your physical ability to complete an activity in the required timescale. In the event the leader deems such a decision is necessary, we will reasonably endeavour to make alternative arrangements, but we will not be liable to provide any refunds for missed activities, and you may be liable for additional costs incurred."
    )
    add_clause(
        "15.4",
        "If the Captain of your flight or cruise ship or any of our staff or agents believes that you could be disruptive or that you are suffering from a contagious disease, they can also refuse to let you proceed with your travel arrangements, restrict your movements on board, disembark you from a ship or aircraft, or remove you from your accommodation or excursion."
    )
    add_clause(
        "15.5",
        "If you are disruptive and prevented from boarding your outbound flight in your country of origin, we will treat your booking as cancelled by you from that moment, and you will have to pay full cancellation charges (see Section 7). If this occurs overseas, then you will become responsible for your own return home and for any other members of your group who cannot or will not travel without you. We will not be liable for any refund, compensation, or any costs or expenses you incur."
    )
    add_clause(
        "15.6",
        "If you are refused carriage because of your behaviour, or you are under the influence of alcohol or drugs, your airline may pass on your details and the date of the refusal of carriage to other airlines for their information. This in turn may make it difficult for you to book other airline tickets. In any of these circumstances, no refunds or compensation will be paid to you."
    )
    add_clause(
        "15.7",
        "As a result of your behaviour during any stage of your holiday, including on an aircraft, transfer, in any accommodation, cruise, or excursion, we reserve the right to make a claim against you for any damages, costs, and expenses (including legal expenses) incurred as a result, including but not limited to (i) cleaning, repairing, or replacing property lost, damaged, or destroyed by you, (ii) compensating any passenger, crew, staff, or agent affected by your actions, and (iii) diverting the aircraft or cruise for the purpose of removing you. Criminal proceedings may also be instigated."
    )
    add_clause(
        "15.8",
        "For the purposes of this section, reference to “you” or “your” includes any other person in your party."
    )

    # -------------------------------------------------------------------------
    # 16. DATA PROTECTION
    # -------------------------------------------------------------------------
    add_heading_1("16. Data Protection")
    add_clause(
        "16.1",
        "We will use and process your data in accordance with our privacy policy, which can be found here and in the footnotes."
    )
    add_clause(
        "16.2",
        "We own the copyright and all intellectual property rights in any photographic, audio, or video material produced by our employees or agents which is produced during your trip (the “Material”). You agree that we may use any such Material in which you appear for promotional and marketing purposes only, and provided always that our use of such Material shall not be, in our reasonable opinion, defamatory or damaging to your personal reputation. If you would prefer us not to use such Material as described herein, please indicate this verbally to your tour leader while on your trip or in writing by email after your trip has ended."
    )
    add_clause(
        "16.3",
        "In the event that you believe either during or after your trip that some Material may be defamatory or otherwise detrimental to you, you shall notify us in writing or by email as soon as possible, and we shall use our reasonable endeavours to withdraw any such Material already published and shall cease to use any such Material in any further marketing or other publications forthwith."
    )

    # -------------------------------------------------------------------------
    # 17. EXCURSIONS
    # -------------------------------------------------------------------------
    add_heading_1("17. Excursions")
    add_clause(
        "17.1",
        "Excursions or other tours that you may choose to book or pay for with a third party whilst you are on holiday are not part of your package holiday provided by us. For any excursion or other tour that you book, your contract will be with the operator of the excursion or tour and not with us. We are not responsible for the provision of the excursion or tour or for anything that happens during the course of its provision by the operator."
    )

    # -------------------------------------------------------------------------
    # 18. VAMOOS ITINERARY
    # -------------------------------------------------------------------------
    add_heading_1("18. Vamoos Itinerary")
    add_clause(
        "18.1",
        "The itinerary for your tour is available in full detail on the Vamoos app, which you should download when you receive your booking confirmation. You will receive a User ID and passcode that will give you access to the app. Basic information about your trip is available on our website, but the Vamoos app should be considered the more up-to-date source. Should there be a discrepancy between the information on the website and Vamoos, the information in Vamoos supersedes that on the website and will be considered the most up-to-date and accurate. Every effort will be made to ensure the accuracy of the information, but local conditions may result in changes to the order of the itinerary, accommodation, or events. In all cases, we will endeavour to ensure that a substitute of equal or greater value is provided and that the basic nature of your tour is not impacted."
    )

    # -------------------------------------------------------------------------
    # 19. FORCE MAJEURE
    # -------------------------------------------------------------------------
    add_heading_1("19. FORCE MAJEURE")
    add_clause(
        "19.1",
        "A Force Majeure Event means any circumstance not within our reasonable control, including but not limited to:"
    )
    add_sublist_item("a.", "‘acts of God’ such as flood, drought, earthquake, or other natural disaster;")
    add_sublist_item("b.", "pandemic;")
    add_sublist_item("c.", "terrorist attack, civil war, civil commotion or riots, war, threat of or preparation for war, armed conflict, imposition of sanctions, embargo, or breaking off of diplomatic relations;")
    add_sublist_item("d.", "nuclear, chemical, or biological contamination, or sonic boom;")
    add_sublist_item("e.", "any law or any action taken by a government or public authority, including without limitation imposing an export or import restriction, quota, or prohibition, or failing to grant a necessary licence or consent;")
    add_sublist_item("f.", "collapse of buildings, fire, explosion, or accident;")
    add_sublist_item("g.", "any labour or trade dispute, strikes, industrial action, or lockouts;")
    add_sublist_item("h.", "non-performance by suppliers or subcontractors;")
    add_sublist_item("i.", "interruption or failure of utility service.")

    add_clause(
        "19.2",
        "If we or our agents are prevented, hindered, or delayed in or from performing any of our obligations under this agreement by a Force Majeure Event, we shall not be in breach of this agreement or otherwise liable for any such failure or delay in the performance of such obligations. The time for performance of such obligations shall be extended accordingly."
    )
    add_clause(
        "19.3",
        "We shall:"
    )
    add_sublist_item("a.", "as soon as reasonably practicable after the start of the Force Majeure Event that will directly impact our service, notify you of said Force Majeure Event, the date on which it started, its likely or potential duration, and the effect of the Force Majeure Event on our ability to perform any of our obligations under the agreement;")
    add_sublist_item("b.", "use all reasonable endeavours to mitigate the effect of the Force Majeure Event on the performance of our obligations.")

    add_clause(
        "19.4",
        "If we are unable to perform our obligations and cancel a trip in advance of departure due to a Force Majeure event which significantly impacts our ability to perform the tour in the destination, you are entitled to either:"
    )
    add_sublist_item("a.", "A full refund of the money you have paid; OR")
    add_sublist_item("b.", "A voucher in the amount of the full price of the cancelled tour; OR")
    add_sublist_item("c.", "A switch to another tour offered by us of equal value. If the replacement tour is of lesser value, we will refund the difference. If the replacement tour is of higher value, you will be liable for the additional amount.")

    add_clause(
        "19.5",
        "We are not liable for the payment of compensation in the event of a trip cancellation due to Force Majeure."
    )
    add_clause(
        "19.6",
        "In the event of a Force Majeure event occurring while you are on a tour, we shall endeavour to contact the relevant agencies and support you as fully as possible with our local partners in the process of evacuation or relocation."
    )

    # -------------------------------------------------------------------------
    # 20. GOVERNING LAW AND JURISDICTION
    # -------------------------------------------------------------------------
    add_heading_1("20. Governing Law and Jurisdiction")
    add_clause(
        "20.1",
        "This Agreement shall be construed, and any dispute between parties determined, under the laws of England and Wales. Disputes shall be subject to the exclusive jurisdiction of the Courts of England and Wales."
    )

    # -------------------------------------------------------------------------
    # APPENDIX 1: TRAVELLERS CODE OF CONDUCT
    # -------------------------------------------------------------------------
    doc.add_page_break()
    
    p_app_tag = doc.add_paragraph()
    p_app_tag.paragraph_format.space_before = Pt(0)
    p_app_tag.paragraph_format.space_after = Pt(2)
    r_app_tag = p_app_tag.add_run("SCHEDULE & STANDARDS")
    r_app_tag.font.name = "Calibri"
    r_app_tag.font.size = Pt(10)
    r_app_tag.font.bold = True
    r_app_tag.font.color.rgb = SLATE_BLUE

    p_app_title = doc.add_paragraph()
    p_app_title.paragraph_format.space_before = Pt(2)
    p_app_title.paragraph_format.space_after = Pt(8)
    r_app_title = p_app_title.add_run("Appendix 1: Travellers Code of Conduct")
    r_app_title.font.name = "Calibri"
    r_app_title.font.size = Pt(18)
    r_app_title.font.bold = True
    r_app_title.font.color.rgb = NAVY

    p_app_pre = doc.add_paragraph()
    p_app_pre.paragraph_format.space_before = Pt(0)
    p_app_pre.paragraph_format.space_after = Pt(8)
    p_app_pre.paragraph_format.line_spacing = 1.15
    r_app_pre = p_app_pre.add_run(
        "This form of travel is rooted in mutual respect for fellow travellers, your hosts, and the community that you visit. We expect all of our travellers to abide by this Code of Conduct and, above all, show sensitivity when you are representing our community."
    )
    r_app_pre.font.name = "Calibri"
    r_app_pre.font.size = Pt(10)
    r_app_pre.font.color.rgb = CHARCOAL

    add_clause(
        "1.",
        "You will at all times respect local attitudes, cultures, and beliefs. Specifically, you will not make comments of a derisory, sexist, inflammatory, or racist nature to anyone during your stay, and you will dress, speak, and behave appropriately at all times."
    )

    code_points = [
        ("Anti-Social Behaviour & Alcohol Conduct:", "You will not act in any way that is considered to be anti-social by the In-Country Coordinator or local inhabitants at any time during your stay. You will adhere to this specifically while under the influence of alcohol."),
        ("Volunteering & Team Contribution:", "Where your trip includes your participation as a volunteer or member of a team, you agree to attend the minimum hours provided by and agreed by us. You understand that you have made a commitment to participate and will perform to the best of your ability."),
        ("Punctuality & Reporting Absences:", "You will arrive at the group meeting point on time each day and, in the event that you are delayed or cannot attend altogether, you will notify the Coordinator as far in advance as is reasonably possible. Alternatively, you may notify another individual, such as the In-Country Instructor or In-Country Staff member, provided that this individual has been expressly nominated in advance by the In-Country Coordinator."),
        ("Independent Personal In-Country Travel:", "You will not take any time out from the itinerary of the trip in order to undertake personal in-country travel or to spend time with friends or family unless you have obtained express permission from the In-Country Coordinator."),
        ("Accommodation & Overnight Guests:", "You will not allow any person to enter or spend the night at your accommodation unless you have obtained express permission from the In-Country Coordinator."),
        ("Equipment, Cleanliness & Communal Order:", "You will ensure that any equipment used by you, whether personal belongings or otherwise, is cleared away and kept tidy and orderly at all times, in both personal and communal living areas of the accommodation."),
        ("Respect for Property & Facilities:", "You will treat your accommodation with respect."),
        ("Alcohol Moderation & Local Laws:", "You agree to drink alcohol only in moderation throughout your entire time abroad. The In-Country Coordinator will explain the drinking rules that apply to your trip when you arrive in-country and, if you are informed of any local customs by the In-Country Coordinator, for example, concerning prohibitions or limits on alcohol consumption, you will adhere to and respect those customs."),
        ("Zero Tolerance for Illegal Substances:", "You will not buy, handle, or consume any illegal substance during your stay. You understand that we have a zero-tolerance policy on this matter, and anyone who is caught in possession of illegal substances or is suspected of using or handling them will be asked to leave their trip and accommodation immediately."),
        ("Advisory on Sexual Relations:", "You acknowledge that we explicitly advise against you developing sexual relations with any persons in the country where you are staying, and you do so at your own risk. Specifically, you accept and understand there may be different attitudes to sexual relations in the countries that you visit, and that this could result in danger to yourself."),
        ("Health Realities & Sexual Safety:", "You also accept that health facilities may be of a lower standard in your trip country and that HIV/AIDS and other sexually transmitted diseases may also be common. You acknowledge that you are aware of the risks of unplanned pregnancy, HIV/AIDS, and other sexually transmitted diseases involved in unprotected sexual relations. You also acknowledge that you are aware that drugs are sometimes used in cases of rape/non-consensual sex, and this may be a risk while socialising during your trip/experience."),
        ("Health, Well-being & Immediate Care:", "You are responsible for your health and well-being. You agree to deal with any medical ailment immediately and seek medical attention and the advice of your medical assistance company, should you require it. You accept that health facilities in your trip/experience country may be of a different standard than you are used to."),
        ("Visa & Return Flight Validity:", "You will ensure that your return flight date falls before the expiration of any in-country visa requirement. You understand that you need to obtain your visa (if required)."),
        ("In-Country Coordinator Instructions:", "You will follow the instructions of the In-Country Coordinator at all times. Failure to do so may put you or others in danger and may lead to you being asked to leave your trip and accommodation immediately.")
    ]

    for bold_tag, body in code_points:
        add_bullet(body, level=1, bold_prefix=bold_tag)

    # Sanctions Box
    add_callout(
        "CRITICAL ENFORCEMENT & DISMISSAL NOTICE",
        [
            "Failure to follow the above guidelines may result in you being asked to leave your trip immediately.",
            "In such circumstances, no refund for the remainder of the tour will be provided under any circumstances, and you will be strictly required to find, arrange, and pay for your own transportation, accommodation, and expenses to leave the trip."
        ],
        border_color="B91C1C",
        bg_color="FEF2F2",
        title_color=RED
    )

    # -------------------------------------------------------------------------
    # FOOTNOTES & OFFICIAL RESOURCES
    # -------------------------------------------------------------------------
    add_heading_1("Official References, Footnotes & Contacts")
    
    ref_points = [
        ("UK Foreign, Commonwealth & Development Office (FCDO):", "For official UK government travel advisories and country-specific guidance, visit: https://www.gov.uk/foreign-travel-advice (referenced in Clause 14.5)."),
        ("US Department of State Travel Advisories:", "For US government consular alerts, country ratings, and STEP enrollment, visit: https://travel.state.gov (referenced in Clause 14.5)."),
        ("Package Travel Regulations 2018:", "The Package Travel and Linked Travel Arrangements Regulations 2018 (UK Statutory Instrument 2018 No. 634) applies to all qualifying package travel arrangements (referenced in Clause 2.1)."),
        ("Privacy Policy & Data Protection:", "Inspired Ventures processes customer data in accordance with applicable UK data protection legislation. The full privacy policy is published at: https://inspiredventures.co.uk/privacy-policy (referenced in Clause 16.1)."),
        ("Official Communications & Customer Service:", "Written notices and customer inquiries should be directed to: info@inspiredventures.co.uk and booking@loveherwild.com.")
    ]

    for title, desc in ref_points:
        add_bullet(desc, level=1, bold_prefix=title)

    return doc

if __name__ == "__main__":
    doc = create_document()
    
    out_path_workspace = r"c:\Users\msf19\.gemini\antigravity\playground\more-community\Inspired-Ventures-Booking-Terms-and-Conditions.docx"
    out_path_exports = r"c:\Users\msf19\.gemini\antigravity\playground\more-community\exports\Inspired-Ventures-Booking-Terms-and-Conditions.docx"
    
    doc.save(out_path_workspace)
    print(f"Saved primary document: {out_path_workspace}")

    os.makedirs(os.path.dirname(out_path_exports), exist_ok=True)
    shutil.copyfile(out_path_workspace, out_path_exports)
    print(f"Copied document to exports: {out_path_exports}")
