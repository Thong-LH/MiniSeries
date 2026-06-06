using MiniSeries.Domain.Entities;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record ChapterQuizDto(
    Guid Id,
    Guid ChapterId,
    string Question,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string CorrectOption,
    string Explanation)
{
    public static ChapterQuizDto FromEntity(ChapterQuiz quiz)
    {
        return new ChapterQuizDto(
            quiz.Id,
            quiz.ChapterId,
            quiz.Question,
            quiz.OptionA,
            quiz.OptionB,
            quiz.OptionC,
            quiz.OptionD,
            quiz.CorrectOption,
            quiz.Explanation);
    }
}
