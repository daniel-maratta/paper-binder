namespace PaperBinder.Application.Documents;

public sealed record DocumentCreateOutcome(
    bool Succeeded,
    DocumentDetail? Document,
    DocumentFailure? Failure)
{
    public static DocumentCreateOutcome Success(DocumentDetail document) => new(true, document, null);

    public static DocumentCreateOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}

public sealed record DocumentListOutcome(
    bool Succeeded,
    IReadOnlyList<DocumentSummary>? Documents,
    DocumentFailure? Failure)
{
    public static DocumentListOutcome Success(IReadOnlyList<DocumentSummary> documents) => new(true, documents, null);

    public static DocumentListOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}

public sealed record DocumentDetailOutcome(
    bool Succeeded,
    DocumentDetail? Document,
    DocumentFailure? Failure)
{
    public static DocumentDetailOutcome Success(DocumentDetail document) => new(true, document, null);

    public static DocumentDetailOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}

public sealed record DocumentDeleteOutcome(
    bool Succeeded,
    DocumentFailure? Failure)
{
    public static DocumentDeleteOutcome Success() => new(true, null);

    public static DocumentDeleteOutcome Failed(DocumentFailure failure) => new(false, failure);
}
