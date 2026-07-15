using System.Security.Cryptography;

namespace PaperBinder.Application.Identity;

public static class OneTimePasswordRules
{
    public const int GeneratedPasswordLength = 20;

    private const string LowercaseAlphabet = "abcdefghjkmnpqrstuvwxyz";
    private const string UppercaseAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string DigitAlphabet = "23456789";
    private const string PasswordAlphabet = LowercaseAlphabet + UppercaseAlphabet + DigitAlphabet;

    public static string Generate()
    {
        var characters = new char[GeneratedPasswordLength];
        characters[0] = Pick(LowercaseAlphabet);
        characters[1] = Pick(UppercaseAlphabet);
        characters[2] = Pick(DigitAlphabet);

        for (var index = 3; index < characters.Length; index++)
        {
            characters[index] = Pick(PasswordAlphabet);
        }

        Shuffle(characters);
        return new string(characters);
    }

    private static char Pick(string alphabet) =>
        alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];

    private static void Shuffle(char[] characters)
    {
        for (var index = characters.Length - 1; index > 0; index--)
        {
            var swapIndex = RandomNumberGenerator.GetInt32(index + 1);
            (characters[index], characters[swapIndex]) = (characters[swapIndex], characters[index]);
        }
    }
}
