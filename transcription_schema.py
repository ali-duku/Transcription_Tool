"""Data schema we asked the textbook transcription pipeline to follow"""

import logging
from enum import StrEnum
from typing import Any, Literal, NamedTuple

from pydantic import BaseModel, TypeAdapter, model_validator

import src.schemas.textbook

logger = logging.getLogger(__name__)


class PageRange(NamedTuple):
    start: int
    end: int


class Point(NamedTuple):
    x: int
    y: int


class Bbox(NamedTuple):
    topright: Point
    bottomleft: Point


class PagedBbox(BaseModel):
    page: int
    position: Bbox

    def to_internal(self) -> src.schemas.textbook.PagedBbox:
        bbox = self.position
        return src.schemas.textbook.PagedBbox(
            pdf_page_idx=self.page,
            bbox=src.schemas.textbook.Bbox(
                x0=bbox.bottomleft.x, y0=bbox.topright.y, x1=bbox.topright.x, y1=bbox.bottomleft.y
            ),
        )


class PageType(StrEnum):
    CONTENT = "content"
    TABLE_OF_CONTENT = "table_of_content"
    UNIT_TABLE_OF_CONTENT = "unit_table_of_content"
    VOCABULARY = "vocabulary"
    PROJECT = "project"
    OTHER = "other"


class LessonPreamble(BaseModel):
    title: str
    lesson_standards: list[str]
    terminology: list[str]
    text: str | None = None


class InstructionalContent(BaseModel):
    section_title: str
    text: str
    images: list[PagedBbox] | None = None


class PracticeQuestionBase(BaseModel):
    id: str
    question_text: str
    question_images: list[PagedBbox] | None = None
    guide_answer: str
    guide_pdf_page: int | None = None
    guide_answer_images: list[PagedBbox] | None = None
    set_up_text: str | None = None
    related_question: str | None = None


class PracticeQuestionFreeForm(PracticeQuestionBase):
    """
    The most common type of questions where the student write the answer as text, including prose, equations,
    numbers, etc.
    Example:

        {
            "question_type": "free_form",
            "question_text": "Where is the capital of France?",
            "guide_answer": "Paris"
        }
    """

    question_type: Literal["free_form"] = "free_form"


class MultipleChoiceOption(BaseModel):
    id: str | None = None
    text: str


class PracticeQuestionMultipleChoice(PracticeQuestionBase):
    """
    Example:

        {
            "question_type": "multiple_choice",
            "question_text": "Pineapple on pizza?",
            "choices": [
                { "id": "A", "text": "Yes!" },
                { "id": "B", "text": "No!!" },
            ],
            "value": 1
        }
    """

    question_type: Literal["multiple_choice"] = "multiple_choice"
    choices: list[MultipleChoiceOption]
    # Index of current answer (1-indexed)
    value: int


class PracticeQuestionCheckbox(PracticeQuestionBase):
    """
    Example:

        {
            "question_type": "checkbox",
            "question_text": "Best ice cream flavour?",
            "choices": [
                { "id": "A", "text": "Vanilla" },
                { "id": "B", "text": "Chocolate" },
                { "id": "C", "text": "Blueberry" },
            ],
            "values": [true, false, true]
        }
    """

    question_type: Literal["checkbox"] = "checkbox"
    choices: list[MultipleChoiceOption]
    values: list[bool]


class PracticeQuestionFillInTheBlanks(PracticeQuestionBase):
    """
    In the question_text field, denote all blanks with `___i___` where i is the index of the field.
    The index is delimited by 3 underscores `___`.
    eg `___1___`, `___2___` (1-indexed so ease of understanding by the contributors).
    Example:

        {
            "question_type": "fill_in_the_blanks",
            "question_text": "The capital of France is ___1___. Derivative of x^2 is ___2___",
            "values": ["Paris", "$2x$"],
            ...
        }
    """

    question_type: Literal["fill_in_the_blanks"] = "fill_in_the_blanks"
    values: list[str]


class PracticeQuestionAnnotate(PracticeQuestionBase):
    """
    All question types that require the student to draw on an existing image or graph.
    The primary means of transcribing the question and answer is via the image bounding box.
    Any text present in the answer is transcribed in the regular `guide_answer` field.
    """

    question_type: Literal["annotate"] = "annotate"


class PracticeQuestionMatching(PracticeQuestionBase):
    """
    Linking or matching questions.

    - Left and right could have different number of items.
    - Each item could have multiple links.
    - Ordering of relationship does not matter.
    Example:

        {
            "question_type": "matching",
            "question_text": "Complete the sentence",
            "left": [
                "The capital of France is",
                "Derivative of x^2 is",
            ],
            "right": [
                "Pineapple",
                "2x",
                "Paris",
                "not London"
            ],
            "relationship": [[1, 3], [1, 4], [2, 1]]
        }
    """

    question_type: Literal["matching"] = "matching"
    left: list[str]
    right: list[str]
    # 1-index tuple [left_idx, right_idx]
    relationship: list[tuple[int, int]]


class PracticeQuestionCreateTable(PracticeQuestionBase):
    """
    Fill in the regular `guide_answer` field using markdown table syntax.
    """

    question_type: Literal["create_table"] = "create_table"


type PracticeQuestion = (
    PracticeQuestionFreeForm
    | PracticeQuestionMultipleChoice
    | PracticeQuestionCheckbox
    | PracticeQuestionFillInTheBlanks
    | PracticeQuestionAnnotate
    | PracticeQuestionMatching
    | PracticeQuestionCreateTable
)


class Transcript(BaseModel):
    textbook_page: int
    textbook_pdf_page: int
    guidebook_pdf_pages: PageRange | None = None
    page_type: PageType
    lesson_preamble: LessonPreamble | None = None
    instructional_content: list[InstructionalContent] | None = None
    practice_questions: list[PracticeQuestion] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_guidebook_pdf_pages(cls, data: Any) -> Any:
        """Treat an empty list for guidebook_pdf_pages as None."""
        if isinstance(data, dict) and data.get("guidebook_pdf_pages") == []:
            data["guidebook_pdf_pages"] = None
        return data

    @model_validator(mode="before")
    @classmethod
    def filter_invalid_questions(cls, data: Any) -> Any:
        """Skip questions that don't conform to the schema instead of failing the entire page."""
        if not isinstance(data, dict):
            return data

        raw_questions = data.get("practice_questions")
        if not raw_questions:
            return data

        # Lazy import to avoid circular dependency issues with the type alias
        question_adapter: TypeAdapter[PracticeQuestion] = TypeAdapter(
            PracticeQuestionFreeForm
            | PracticeQuestionMultipleChoice
            | PracticeQuestionCheckbox
            | PracticeQuestionFillInTheBlanks
            | PracticeQuestionAnnotate
            | PracticeQuestionMatching
            | PracticeQuestionCreateTable
        )

        valid_questions = []
        invalid_count = 0
        for q in raw_questions:
            try:
                question_adapter.validate_python(q)
                valid_questions.append(q)
            except Exception:
                invalid_count += 1
                q_id = q.get("id", "unknown") if isinstance(q, dict) else "unknown"
                logger.debug(
                    "Skipping invalid question %s on page %s: missing required fields",
                    q_id,
                    data.get("textbook_pdf_page", "unknown"),
                )

        data["practice_questions"] = valid_questions if valid_questions else None
        return data
