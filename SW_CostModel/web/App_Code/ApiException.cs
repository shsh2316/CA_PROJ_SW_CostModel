using System;

/// <summary>An error the API reports to the page as { error: { code, message } } with an HTTP status.</summary>
public class ApiException : Exception
{
    public int Status { get; private set; }
    public string Code { get; private set; }

    public ApiException(int status, string code, string message) : this(status, code, message, null) { }

    public ApiException(int status, string code, string message, Exception inner) : base(message, inner)
    {
        Status = status;
        Code = code;
    }
}
