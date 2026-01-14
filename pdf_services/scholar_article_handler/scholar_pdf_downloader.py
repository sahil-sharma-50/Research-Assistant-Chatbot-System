# gs_extractor.py
"""
gs_extractor.py

This module downloads PDF articles based on the input query from Google Scholar.
"""

import os
import re
from typing import Optional
from urllib.parse import quote, urlparse

import requests
from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError
from scholarly import scholarly

from pdf_services.config.settings import Config


class ScholarPDFDownloader:
    def __init__(
        self,
        downloaded_folder: str = Config.DOWNLOAD_FOLDER,
        dest_folder: str = Config.DEST_FOLDER,
    ):
        self.downloaded_folder = downloaded_folder
        self.dest_folder = dest_folder

    def download_gs_pdf(self, user_query: str, num_pdf: int, source: str) -> None:
        """
        Downloads PDFs from Google Scholar based on a search query.

        Args:
            query (str): The search query for Google Scholar.
            num_pdf (int): The number of PDFs to download.
            source (str): The source of the PDFs (e.g., "IEEE", "Springer",  etc.).
        """
        print("Downloading relevant information from Google Scholar...")
        print("\n\n")
        print(f"Query: {user_query}", f"Number of PDFs to download: {num_pdf}", f"Source: {source}", sep="\n")
        print("\n\n")
        source_filters = {
            "All": "",
            "IEEE": "site:ieee.org",
            "Springer": "site:springer.com",
            "Arxiv": "site:arxiv.org"
        }
        source_website = source_filters.get(source, "")
        user_query = f"{user_query} {source_website}" if source != "All" else user_query
        search_result = scholarly.search_pubs(user_query)
        download_count = 1

        for result in search_result:
            if download_count > num_pdf:
                break

            if self._process_result(result, download_count):
                download_count += 1

    def _process_result(self, result: dict, count: int) -> bool:
        """Process a single search result and attempt to download the PDF."""
        filename = self._generate_filename(result)
        file_path = f"{self.dest_folder}/{filename}.pdf"
        
        check_scholarly_more_pdf = f"{self.downloaded_folder}/{filename}.pdf"
        if os.path.exists(check_scholarly_more_pdf):
            return False

        if os.path.exists(file_path):
            print(f"{count}. PDF already exists; Skipping download for '{filename}'")
            return False

        pub_url = result.get("pub_url", "")
        if not pub_url:
            return False
        parsed_url = urlparse(pub_url)

        download_successful = False
        
        if parsed_url.netloc == "link.springer.com" and parsed_url.path.startswith("/article/"):
            download_successful = self._handle_springer(parsed_url, filename)
        elif parsed_url.netloc == "ieeexplore.ieee.org":
            paper_id = parsed_url.path.strip('/').split('/')[-1]
            download_successful = self._handle_ieee(pub_url, paper_id, filename)
        elif result.get("eprint_url"):
            download_successful = self._handle_eprint(result, filename)

        if download_successful:
            if self._validate_pdf(f"{self.downloaded_folder}/{filename}.pdf"):
                print(
                    f"{count}. PDF Downloaded; Title: '{filename}'; Website: '{parsed_url.netloc}'; Folder: '{self.downloaded_folder}'"
                )
                return True
            else:
                os.remove(f"{self.downloaded_folder}/{filename}.pdf")
        return False
    
    def _generate_filename(self, result: dict) -> str:
        """Generates a filename in the format 'Author et al__Year__Title.pdf'."""
        author_list = result["bib"].get("author", ["Unknown Author"])
        if isinstance(author_list, list) and len(author_list) > 0 and isinstance(author_list[0], str):
            first_author = author_list[0].split(",")[0].strip()
        else:
            first_author = "Unknown Author"
        author_part = f"{first_author} et al" if len(author_list) > 1 else first_author
        year = result["bib"].get("pub_year", "UnknownYear")
        title = self._sanitize_pdfname(result["bib"].get("title", "Unknown Title"))
        doi = self._get_doi_from_crossref(
            title, author_part, year
        )
        encoded_doi = self._url_encode_doi(doi) if doi else None  # URL-encode the DOI
        filename = f"{author_part}__{year}__{title}"
        if encoded_doi:
            filename += f"__{encoded_doi}"
        return filename
    
    def _handle_springer(self, parsed_url: str, filename: str) -> Optional[bool]:
        """Handle the downloading of PDFs from Springer."""

        pdf_url = parsed_url.geturl().replace("article", "content/pdf") + ".pdf"
        return self._download_pdf(pdf_url, f"{self.downloaded_folder}/{filename}.pdf")

    def _handle_ieee(self, pub_url: str, paper_id:str, filename: str) -> Optional[bool]:
        """Handle the downloading of PDFs from IEEE."""
        
        if self._download_ieee_by_id(paper_id, filename, save_dir=f"{self.downloaded_folder}"):
            return True

        doi = self._extract_doi_from_html(pub_url)
        if not doi:
            return False
        return self._download_using_external_provider(doi, f"{self.downloaded_folder}/{filename}.pdf")
    
    def _download_ieee_by_id(self, paper_id, filename, save_dir=None, ext=".pdf"):
        import subprocess as sp
        output_file= filename if save_dir==None else  save_dir+"/"+filename
        output_file+=ext
        try:
            pdf_url = f'https://ieeexplore.ieee.org/stampPDF/getPDF.jsp?tp=&arnumber={paper_id}'
            user_agent='Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1)'
            sp.call(['wget', f'--user-agent="{user_agent}"', '-O', output_file, pdf_url])
            return True
        except Exception as e:
            return False

    def _handle_eprint(self, result: dict, title: str) -> Optional[bool]:
        """Handle the downloading of PDFs from ePrint URLs."""
        pdf_url = result["eprint_url"]
        return self._download_pdf(pdf_url, f"{self.downloaded_folder}/{title}.pdf")
    
    def _download_pdf(self, pdf_url: str, save_path: str) -> bool:
        """Downloads a PDF from a URL and saves it to the specified path."""
        if not pdf_url.startswith("http"):
            return False

        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        pdf_response = requests.get(pdf_url, headers=Config.HEADERS, timeout=100)
        if pdf_response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(pdf_response.content)
            return True
        return False

    def _validate_pdf(self, file_path: str) -> bool:
        """Validate that the PDF can be read"""
        try:
            with open(file_path, "rb") as f:
                PdfReader(f)
            return True
        except PdfReadError:
            return False


    def _download_using_external_provider(self, doi: Optional[str], save_path: str) -> bool:
        """Download article from External Provider based on the given DOI."""

        doi = doi.split("doi.org/")[-1]
        url = f"https://www.wellesu.com/{doi}"

        response = requests.get(url, headers=Config.HEADERS, timeout=50)

        if response.status_code == 200:
            from bs4 import BeautifulSoup

            soup = BeautifulSoup(response.text, "html.parser")
            embed_tag = soup.find("embed", {"id": "pdf"})
            if embed_tag and "src" in embed_tag.attrs:
                pdf_url = embed_tag["src"]
                return self._download_pdf(pdf_url, save_path)
        else:
            return False

    def _get_doi_from_crossref(self, title, author, pub_year):
        # Format the query for the API
        formatted_title = title.replace(" ", "+")
        formatted_author = author.replace(" ", "+")
        url = f"https://api.crossref.org/works?query.bibliographic={formatted_title}+{formatted_author}&filter=from-pub-date:{pub_year},until-pub-date:{pub_year}"

        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            if data["message"]["total-results"] > 0:
                doi = data["message"]["items"][0]["DOI"]
                return doi
        return None

    def _url_encode_doi(self, doi: str) -> str:
        """URL-encodes the given DOI to make it safe for use in filenames."""
        return quote(doi, safe="")

    def _extract_doi_from_html(self, url: str) -> Optional[str]:
        """Extracts the DOI from the HTML content of the given URL."""
        response = requests.get(url, headers=Config.HEADERS, timeout=10)
        if response.status_code != 200:
            return None
        doi_pattern = re.compile(r'https://doi\.org/[^\s\'">]+')
        match = doi_pattern.search(response.text)
        return match.group(0) if match else None


    def _sanitize_pdfname(self, pdfname: str) -> str:
        """Sanitize the filename by removing invalid characters and replacing spaces with underscores."""
        sanitized_name = re.sub(r"[^a-zA-Z0-9\s]", "", pdfname)
        sanitized_name =  re.sub(r"\s+", " ", sanitized_name).strip()
        # Truncate to 50 characters, split on space
        if len(sanitized_name) > 70:
            pdf_name = sanitized_name[:60].rsplit(" ", 1)[0]
        else:
            pdf_name = sanitized_name
        return pdf_name


# Usuage:
# downloader = ScholarPDFDownloader()
# query = "electric motor production"
# downloader.download_gs_pdf(query=query, num_pdf=1)
# print("PDF Downloaded !!")
