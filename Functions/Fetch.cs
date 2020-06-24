using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CssWeb.Functions
{
    public static class Fetch
    {
         [FunctionName("Fetch")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req, 
            ILogger log)
        {
            string target = req.Query["target"];
            string cookieData = req.Query["cookieData"];

            log.LogInformation($"Fetch({target}), cookie={cookieData}");

            var httpClientHandler = new HttpClientHandler();
            using (var httpClient = new HttpClient(httpClientHandler))
            {
                if (!String.IsNullOrWhiteSpace(cookieData))
                {
                    string[] cookieParts = cookieData.Split("|");
                    httpClientHandler.CookieContainer.Add(new Cookie(
                        name: cookieParts[0],
                        value: cookieParts[1],
                        path: cookieParts[2],
                        domain: cookieParts[3]));
                }

                using (HttpResponseMessage response = await httpClient.GetAsync(target))
                {
                    if (response.IsSuccessStatusCode)
                    {
                        byte[] responseContent = await response.Content.ReadAsByteArrayAsync();
                        return new FileContentResult(responseContent, response.Content.Headers.ContentType.MediaType);
                    }
                    else
                    {
                        return new BadRequestObjectResult($"Fetch({target}), cookie={cookieData}: target error {response.StatusCode}");
                    }
                }
            }
        }
    }
}
