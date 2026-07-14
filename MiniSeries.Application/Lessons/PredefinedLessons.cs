using System;
using System.Collections.Generic;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons;

public static class PredefinedLessons
{
    public static bool IsPredefined(string title, OutputMode outputMode)
    {
        // Only treat as predefined (mocked) if OutputMode is Video
        return outputMode == OutputMode.Video;
    }

    public static string GetCharacterProfile(string title)
    {
        if (title.Contains("tương đối", StringComparison.OrdinalIgnoreCase))
            return "Phi hành gia Nam, trẻ trung, mặc bộ đồ phi hành gia màu trắng viền xanh dương.";
        if (title.Contains("khối lượng", StringComparison.OrdinalIgnoreCase) || title.Contains("bảo toàn", StringComparison.OrdinalIgnoreCase))
            return "Giả kim thuật sư Alaric, râu tóc bạc phơ, mặc áo choàng phù thủy màu tím.";
        if (title.Contains("nam châm", StringComparison.OrdinalIgnoreCase))
            return "Chiến binh Leo (cực Bắc - Đỏ) và Chiến binh Rex (cực Nam - Xanh).";
        
        // Fallback / Wildcard
        return "Chú bướm nhỏ màu vàng rực rỡ với đôi cánh mềm mại.";
    }

    public static string GetOverallScript(string title)
    {
        if (title.Contains("tương đối", StringComparison.OrdinalIgnoreCase))
            return "Kịch bản hoạt hình ngắn kể về phi hành gia Nam tham gia chuyến du hành vũ trụ cận ánh sáng. Do hiệu ứng giãn nở thời gian, khi trở về Trái Đất sau vài năm du hành, anh vẫn trẻ trung trong khi người bạn thân Minh đã thành một ông cụ tóc bạc. Câu chuyện minh họa trực quan thuyết tương đối của Einstein.";
        if (title.Contains("khối lượng", StringComparison.OrdinalIgnoreCase) || title.Contains("bảo toàn", StringComparison.OrdinalIgnoreCase))
            return "Câu chuyện kể về cuộc thực nghiệm của nhà hóa học cổ đại Alaric. Ông thực hiện phản ứng nung nóng phốt pho trong bình kín, chứng minh tổng khối lượng trước và sau phản ứng không hề thay đổi, lập nên định luật bảo toàn khối lượng kinh điển.";
        if (title.Contains("nam châm", StringComparison.OrdinalIgnoreCase))
            return "Cuộc đối đầu đầy kịch tính giữa hai chiến binh năng lượng mang hai cực trái dấu. Khi cố tiếp cận, họ bị đẩy ra xa (cùng cực), nhưng khi kết hợp khéo léo (khác cực), sức hút tự nhiên kéo họ lại gần nhau tạo nên sức mạnh vô địch.";
        
        // Fallback / Wildcard
        return "Hành trình chuyển hóa diệu kỳ của một chú sâu nhỏ chậm chạp, trải qua giai đoạn nhộng yên lặng trong kén, để rồi lột xác trở thành một chú bướm vàng xinh đẹp cất cánh bay cao giữa vườn hoa rực rỡ.";
    }

    public static List<Chapter> GetChapters(Guid lessonId, string title, string baseUrl = "http://localhost:5137")
    {
        var chapters = new List<Chapter>();

        if (title.Contains("tương đối", StringComparison.OrdinalIgnoreCase))
        {
            var ch1Id = Guid.NewGuid();
            var ch2Id = Guid.NewGuid();
            var ch3Id = Guid.NewGuid();

            chapters.Add(new Chapter
            {
                Id = ch1Id,
                LessonId = lessonId,
                Order = 1,
                Summary = "Nam chào tạm biệt Minh để bước lên phi thuyền tiến vào không gian.",
                FullPrompt = "A futuristic spaceship launching into cosmos, astronaut waving goodbye, sci-fi theme",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson1_Ch1.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch1Id,
                    Question = "Tại sao Nam lại trẻ hơn Minh khi trở về?",
                    OptionA = "Do Nam ăn thực phẩm vũ trụ",
                    OptionB = "Do thời gian trôi chậm hơn ở tốc độ cận ánh sáng",
                    OptionC = "Do Minh sống ở vùng khí hậu nóng hơn",
                    OptionD = "Do Nam ngủ đông trên tàu vũ trụ",
                    CorrectOption = "B",
                    Explanation = "Theo thuyết tương đối rộng và hẹp của Einstein, một vật di chuyển càng nhanh thì thời gian trôi qua đối với nó càng chậm lại so với hệ quy chiếu đứng yên."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch2Id,
                LessonId = lessonId,
                Order = 2,
                Summary = "Nam trải nghiệm cuộc sống trên phi thuyền, ngắm nhìn các thiên hà trôi qua.",
                FullPrompt = "Astronaut looking out of spaceship window at galaxies and stars, time dilation effect",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson1_Ch2.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch2Id,
                    Question = "Hiệu ứng giãn nở thời gian xảy ra rõ rệt nhất khi tốc độ vật thể đạt tới mức nào?",
                    OptionA = "Tốc độ âm thanh",
                    OptionB = "Tốc độ chạy bộ",
                    OptionC = "Cận tốc độ ánh sáng",
                    OptionD = "Tốc độ của tên lửa thường",
                    CorrectOption = "C",
                    Explanation = "Hiệu ứng co độ dài và giãn thời gian chỉ trở nên đáng kể khi tốc độ di chuyển tiệm cận với tốc độ ánh sáng (khoảng 300,000 km/s)."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch3Id,
                LessonId = lessonId,
                Order = 3,
                Summary = "Nam trở về Trái Đất và ngỡ ngàng gặp lại Minh lúc này đã tóc bạc trắng.",
                FullPrompt = "Astronaut meets elderly friend with gray hair on Earth, emotional reunion",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson1_Ch3.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch3Id,
                    Question = "Ai là người đề xuất Thuyết tương đối?",
                    OptionA = "Isaac Newton",
                    OptionB = "Albert Einstein",
                    OptionC = "Galileo Galilei",
                    OptionD = "Stephen Hawking",
                    CorrectOption = "B",
                    Explanation = "Albert Einstein công bố Thuyết tương đối hẹp vào năm 1905 và Thuyết tương đối rộng vào năm 1915."
                }
            });
        }
        else if (title.Contains("khối lượng", StringComparison.OrdinalIgnoreCase) || title.Contains("bảo toàn", StringComparison.OrdinalIgnoreCase))
        {
            var ch1Id = Guid.NewGuid();
            var ch2Id = Guid.NewGuid();
            var ch3Id = Guid.NewGuid();

            chapters.Add(new Chapter
            {
                Id = ch1Id,
                LessonId = lessonId,
                Order = 1,
                Summary = "Alaric cân đo đong đếm lượng phốt pho đỏ cẩn thận trước khi cho vào bình thủy tinh.",
                FullPrompt = "Old alchemist measuring red powder in a mysterious laboratory, retro style",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson2_Ch1.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch1Id,
                    Question = "Tại sao phản ứng phải được thực hiện trong bình kín?",
                    OptionA = "Để ngăn chất phản ứng bay hơi mất ra ngoài",
                    OptionB = "Để bình không bị nổ do nhiệt độ cao",
                    OptionC = "Để ngọn lửa đóng vai trò xúc tác",
                    OptionD = "Để chất phản ứng chuyển sang màu xanh",
                    CorrectOption = "A",
                    Explanation = "Định luật bảo toàn khối lượng chỉ được nghiệm đúng chính xác khi hệ phản ứng là hệ kín, tránh sự thất thoát hoặc thêm vào của các chất khí."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch2Id,
                LessonId = lessonId,
                Order = 2,
                Summary = "Phản ứng hóa học diễn ra dữ dội, ngọn lửa sáng bùng lên bên trong bình kín.",
                FullPrompt = "Chemical reaction with bright light inside a sealed flask, magical alchemy",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson2_Ch2.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch2Id,
                    Question = "Sau phản ứng hóa học, khối lượng của các nguyên tử thay đổi như thế nào?",
                    OptionA = "Tăng lên gấp đôi",
                    OptionB = "Không thay đổi, chỉ sắp xếp lại liên kết",
                    OptionC = "Giảm đi một nửa",
                    OptionD = "Biến mất hoàn toàn",
                    CorrectOption = "B",
                    Explanation = "Trong phản ứng hóa học, liên kết giữa các nguyên tử thay đổi nhưng số lượng nguyên tử mỗi loại vẫn giữ nguyên, dẫn đến khối lượng bảo toàn."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch3Id,
                LessonId = lessonId,
                Order = 3,
                Summary = "Alaric đặt bình lên bàn cân, kim cân chỉ đúng vạch cũ, chứng minh định luật thành công.",
                FullPrompt = "Alchemist weighing the flask on a balance scale, success and satisfaction",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson2_Ch3.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch3Id,
                    Question = "Định luật bảo toàn khối lượng do ai đồng sáng lập?",
                    OptionA = "Lomonosov và Lavoisier",
                    OptionB = "Dalton và Mendeleev",
                    OptionC = "Marie Curie và Nobel",
                    OptionD = "Boyle và Charles",
                    CorrectOption = "A",
                    Explanation = "Định luật bảo toàn khối lượng được phát biểu độc lập bởi Mikhail Lomonosov (1748) và Antoine Lavoisier (1789)."
                }
            });
        }
        else if (title.Contains("nam châm", StringComparison.OrdinalIgnoreCase))
        {
            var ch1Id = Guid.NewGuid();
            var ch2Id = Guid.NewGuid();
            var ch3Id = Guid.NewGuid();

            chapters.Add(new Chapter
            {
                Id = ch1Id,
                LessonId = lessonId,
                Order = 1,
                Summary = "Hai chiến binh mang cực Bắc (Leo) và cực Nam (Rex) bắt đầu trận chiến.",
                FullPrompt = "Two warriors with red and blue armor facing each other, dynamic pose, anime style",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson3_Ch1.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch1Id,
                    Question = "Hai cực của nam châm được ký hiệu là gì?",
                    OptionA = "Đông (E) và Tây (W)",
                    OptionB = "Bắc (N) và Nam (S)",
                    OptionC = "Trái (L) và Phải (R)",
                    OptionD = "Cộng (+) và Trừ (-)",
                    CorrectOption = "B",
                    Explanation = "Nam châm luôn có hai cực từ là cực Bắc (North - thường sơn màu đỏ) và cực Nam (South - thường sơn màu xanh)."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch2Id,
                LessonId = lessonId,
                Order = 2,
                Summary = "Khi hai chiến binh cùng mang cực Bắc cố tiến lại gần, lực cản đẩy văng họ ra.",
                FullPrompt = "Two red warriors pushed apart by an invisible force field, sparks flying",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson3_Ch2.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch2Id,
                    Question = "Hiện tượng gì xảy ra khi đưa hai cực cùng tên lại gần nhau?",
                    OptionA = "Chúng hút nhau",
                    OptionB = "Chúng đẩy nhau",
                    OptionC = "Chúng triệt tiêu lẫn nhau",
                    OptionD = "Chúng chuyển thành chất lỏng",
                    CorrectOption = "B",
                    Explanation = "Các cực từ cùng tên (ví dụ Bắc-Bắc hoặc Nam-Nam) thì đẩy nhau, các cực từ khác tên thì hút nhau."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch3Id,
                LessonId = lessonId,
                Order = 3,
                Summary = "Leo và Rex bắt tay nhau, sức hút kéo hai người lại với nhau tạo nên năng lượng cộng hưởng.",
                FullPrompt = "Red and blue warriors shake hands, bright energy joining them, epic ending",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson3_Ch3.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch3Id,
                    Question = "Lực tác dụng giữa hai nam châm được gọi là gì?",
                    OptionA = "Lực hấp dẫn",
                    OptionB = "Lực từ",
                    OptionC = "Lực ma sát",
                    OptionD = "Lực đàn hồi",
                    CorrectOption = "B",
                    Explanation = "Lực tương tác giữa các nam châm hoặc giữa nam châm và các vật liệu từ tính được gọi là lực từ."
                }
            });
        }
        else
        {
            // 4. Wildcard / Custom Fallback: Vòng đời của bướm
            var ch1Id = Guid.NewGuid();
            var ch2Id = Guid.NewGuid();
            var ch3Id = Guid.NewGuid();

            chapters.Add(new Chapter
            {
                Id = ch1Id,
                LessonId = lessonId,
                Order = 1,
                Summary = "Sâu bướm nở ra từ trứng bướm nhỏ bám trên mặt lá cây.",
                FullPrompt = "A tiny green caterpillar hatching from an egg on a green leaf, macro, cute anime style",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson4_Ch1.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch1Id,
                    Question = "Giai đoạn đầu tiên của vòng đời loài bướm là gì?",
                    OptionA = "Sâu bướm",
                    OptionB = "Trứng",
                    OptionC = "Nhộng",
                    OptionD = "Bướm trưởng thành",
                    CorrectOption = "B",
                    Explanation = "Vòng đời của bướm bắt đầu từ giai đoạn trứng bướm được đẻ trên các lá cây chủ."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch2Id,
                LessonId = lessonId,
                Order = 2,
                Summary = "Sâu bướm treo mình ngược, biến đổi hình dạng và cuốn kén thành nhộng.",
                FullPrompt = "A caterpillar transforming into a cocoon hanging on a branch, nature science style",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson4_Ch2.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch2Id,
                    Question = "Trong kén nhộng, cơ thể sâu bướm trải qua quá trình gì?",
                    OptionA = "Ngủ đông không biến đổi",
                    OptionB = "Chuyển hóa cấu trúc tế bào (biến thái hoàn toàn)",
                    OptionC = "Sinh con bên trong kén",
                    OptionD = "Ăn chất dinh dưỡng từ bên ngoài kén",
                    CorrectOption = "B",
                    Explanation = "Trong giai đoạn nhộng, sâu bướm trải qua quá trình biến thái hoàn toàn, phá vỡ cấu trúc cơ thể sâu và hình thành cánh, chân của bướm trưởng thành."
                }
            });
            chapters.Add(new Chapter
            {
                Id = ch3Id,
                LessonId = lessonId,
                Order = 3,
                Summary = "Vỏ nhộng nứt ra, chú bướm vàng rực rỡ cất cánh bay cao.",
                FullPrompt = "A beautiful golden butterfly emerging from cocoon and flying away in a garden, sunbeams",
                Status = ChapterStatus.ReadyForGeneration,
                VideoUrl = "https://res.cloudinary.com/doekn7cni/video/upload/Lesson4_Ch3.mp4",
                Quiz = new ChapterQuiz
                {
                    Id = Guid.NewGuid(),
                    ChapterId = ch3Id,
                    Question = "Sau khi chui ra khỏi kén, bướm cần làm gì trước khi bay?",
                    OptionA = "Ăn kén nhộng cũ",
                    OptionB = "Bơm dịch vào cánh để cánh căng phồng và khô ráo",
                    OptionC = "Đi ngủ tiếp",
                    OptionD = "Tìm kiếm bướm khác ngay lập tức",
                    CorrectOption = "B",
                    Explanation = "Khi mới chui ra, cánh bướm còn ướt và mềm. Bướm phải bơm dịch cơ thể vào các gân cánh để làm căng cánh, chờ cánh khô hoàn toàn mới có thể bay."
                }
            });
        }

        return chapters;
    }
}
