using System;
using System.IO;
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
        private static readonly HttpClient HttpClient = new HttpClient();

        [FunctionName("Fetch")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req, 
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function Fetch received a request.");

            string target = req.Query["target"];

            using (HttpResponseMessage response = await HttpClient.GetAsync(target))
            {
                if (response.IsSuccessStatusCode)
                {
                    byte[] responseContent = await response.Content.ReadAsByteArrayAsync();
                    return new FileContentResult(responseContent, response.Content.Headers.ContentType.MediaType);
                }
                else
                {
                    return new BadRequestObjectResult($"Target error: {response.StatusCode}");
                }
            }
        }
    }
}
