(async () => {
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN // 使用 GitHub Personal Access Token
    });
    // 其餘邏輯不變
})();


const owner = "ningjing211"; // 你的 GitHub 用戶名
const repo = "merged-harmony"; // 你的 GitHub 專案名稱
const branch = "main"; // 分支名稱
const filePath = "/public/imagesOrder.json"; // imagesOrder.json 在倉庫中的路徑

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    const { folderName, fileName, newDescription } = req.body;

    if (!folderName || !fileName || typeof newDescription !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    try {
        // 取得現有的 imagesOrder.json
        const { data: file } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch
        });

        const content = Buffer.from(file.content, 'base64').toString('utf8');
        const imagesOrder = JSON.parse(content);

        // 更新描述
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) {
            return res.status(404).json({ error: 'Image not found in the specified folder' });
        }

        image.imageDescription = newDescription;

        // 將更新後的 imagesOrder.json 上傳到 GitHub
        const updatedContent = Buffer.from(JSON.stringify(imagesOrder, null, 2)).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: "Update imagesOrder.json",
            content: updatedContent,
            sha: file.sha,
            branch
        });

        res.json({ message: 'Image description updated successfully' });
    } catch (err) {
        console.error('Error updating image description:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
