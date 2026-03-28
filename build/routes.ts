/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TextToImageController } from './../src/controllers/TextToImageController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RechargeController } from './../src/controllers/RechargeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PaymentController } from './../src/controllers/PaymentController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OpenaiController } from './../src/controllers/OpenaiController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ImageController } from './../src/controllers/ImageController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GalleryController } from './../src/controllers/GalleryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CategoryController } from './../src/controllers/CategoryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BananaTextToImageController } from './../src/controllers/BananaTextToImageController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../src/controllers/AuthController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AppModelController } from './../src/controllers/AppModelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminOrderController } from './../src/controllers/AdminOrderController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminModelController } from './../src/controllers/AdminModelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminController } from './../src/controllers/AdminController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminCategoryController } from './../src/controllers/AdminCategoryController';
import { expressAuthentication } from './../src/middleware/authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "TextToImageGenerateBody": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string"},
            "size": {"dataType":"string"},
            "model": {"dataType":"string"},
            "n": {"dataType":"double"},
            "quality": {"dataType":"string"},
            "style": {"dataType":"string"},
            "uploadToCos": {"dataType":"boolean"},
            "useStream": {"dataType":"boolean"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImageToImageBody": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string","required":true},
            "size": {"dataType":"string"},
            "imageUrl": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "uploadToCos": {"dataType":"boolean"},
            "useStream": {"dataType":"boolean"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateRechargeOrderBody": {
        "dataType": "refObject",
        "properties": {
            "packageId": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MockCallbackBody": {
        "dataType": "refObject",
        "properties": {
            "orderNo": {"dataType":"string","required":true},
            "tradeNo": {"dataType":"string"},
            "status": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnalyzeImageBody": {
        "dataType": "refObject",
        "properties": {
            "imageUrl": {"dataType":"string","required":true},
            "prompt": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateTextBody": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string","required":true},
            "systemPrompt": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OpenaiGenerateImageBody": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string","required":true},
            "model": {"dataType":"string"},
            "n": {"dataType":"double"},
            "size": {"dataType":"string"},
            "response_format": {"dataType":"string"},
            "style": {"dataType":"string"},
            "quality": {"dataType":"string"},
            "uploadToCos": {"dataType":"boolean"},
            "includeBase64InResponse": {"dataType":"boolean"},
            "includeThumbnailInResponse": {"dataType":"boolean"},
            "saveToDb": {"dataType":"boolean"},
            "title": {"dataType":"string"},
            "description": {"dataType":"string"},
            "category_id": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateImageByChatBody": {
        "dataType": "refObject",
        "properties": {
            "session_id": {"dataType":"string"},
            "prompt": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "messages": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"any","required":true},"role":{"dataType":"string","required":true}}}},
            "model": {"dataType":"string"},
            "group": {"dataType":"string"},
            "stream": {"dataType":"boolean"},
            "uploadToCos": {"dataType":"boolean"},
            "temperature": {"dataType":"double"},
            "top_p": {"dataType":"double"},
            "frequency_penalty": {"dataType":"double"},
            "presence_penalty": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateImageBody": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "prompt": {"dataType":"string"},
            "category_id": {"dataType":"double"},
            "title": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateImageBody": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string"},
            "description": {"dataType":"string"},
            "prompt": {"dataType":"string"},
            "category_id": {"dataType":"double"},
            "title": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCategoryBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "sort_order": {"dataType":"double"},
            "status": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCategoryBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "sort_order": {"dataType":"double"},
            "status": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSortOrderBody": {
        "dataType": "refObject",
        "properties": {
            "sort_order": {"dataType":"double","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BananaGenerateImageBody": {
        "dataType": "refObject",
        "properties": {
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text-to-image"]},{"dataType":"enum","enums":["image-to-image"]}]},
            "model": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
            "aspectRatio": {"dataType":"string"},
            "imageUrls": {"dataType":"array","array":{"dataType":"string"}},
            "imageUrl": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginBody": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SendCodeBody": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterBody": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateModelBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "model_key": {"dataType":"string"},
            "manufacturer": {"dataType":"string"},
            "description": {"dataType":"string"},
            "aspect_ratio": {"dataType":"string"},
            "aspect_ratios": {"dataType":"array","array":{"dataType":"string"}},
            "status": {"dataType":"double"},
            "consume_points": {"dataType":"double","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateModelBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "model_key": {"dataType":"string"},
            "manufacturer": {"dataType":"string"},
            "description": {"dataType":"string"},
            "aspect_ratio": {"dataType":"string"},
            "aspect_ratios": {"dataType":"array","array":{"dataType":"string"}},
            "status": {"dataType":"double"},
            "consume_points": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminLoginBody": {
        "dataType": "refObject",
        "properties": {
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminCreateCategoryBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "sort_order": {"dataType":"double"},
            "status": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminUpdateCategoryBody": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "sort_order": {"dataType":"double"},
            "status": {"dataType":"double"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminUpdateSortOrderBody": {
        "dataType": "refObject",
        "properties": {
            "sort_order": {"dataType":"double","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"ignore","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsTextToImageController_generateImageAndUpload: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"TextToImageGenerateBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/text-to-image',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController.prototype.generateImageAndUpload)),

            async function TextToImageController_generateImageAndUpload(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTextToImageController_generateImageAndUpload, request, response });

                const controller = new TextToImageController();

              await templateService.apiHandler({
                methodName: 'generateImageAndUpload',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTextToImageController_getUploadTaskStatus: Record<string, TsoaRoute.ParameterSchema> = {
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
        };
        app.get('/app/text-to-image/tasks/:taskId',
            ...(fetchMiddlewares<RequestHandler>(TextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController.prototype.getUploadTaskStatus)),

            async function TextToImageController_getUploadTaskStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTextToImageController_getUploadTaskStatus, request, response });

                const controller = new TextToImageController();

              await templateService.apiHandler({
                methodName: 'getUploadTaskStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTextToImageController_getRecordsByUser: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                generation_type: {"in":"query","name":"generation_type","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                limit: {"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/app/text-to-image/records',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController.prototype.getRecordsByUser)),

            async function TextToImageController_getRecordsByUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTextToImageController_getRecordsByUser, request, response });

                const controller = new TextToImageController();

              await templateService.apiHandler({
                methodName: 'getRecordsByUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTextToImageController_getRecordBySession: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/app/text-to-image/records/:sessionId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController.prototype.getRecordBySession)),

            async function TextToImageController_getRecordBySession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTextToImageController_getRecordBySession, request, response });

                const controller = new TextToImageController();

              await templateService.apiHandler({
                methodName: 'getRecordBySession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTextToImageController_imageToImage: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"ImageToImageBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/text-to-image/image-to-image',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(TextToImageController.prototype.imageToImage)),

            async function TextToImageController_imageToImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTextToImageController_imageToImage, request, response });

                const controller = new TextToImageController();

              await templateService.apiHandler({
                methodName: 'imageToImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_getPackages: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/app/recharge/packages',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.getPackages)),

            async function RechargeController_getPackages(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_getPackages, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'getPackages',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_createOrder: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateRechargeOrderBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/recharge/orders',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.createOrder)),

            async function RechargeController_createOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_createOrder, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'createOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_listOrders: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/app/recharge/orders',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.listOrders)),

            async function RechargeController_listOrders(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_listOrders, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'listOrders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_getOrderDetail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/app/recharge/orders/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.getOrderDetail)),

            async function RechargeController_getOrderDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_getOrderDetail, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'getOrderDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_mockPay: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/recharge/orders/:id/mock-pay',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.mockPay)),

            async function RechargeController_mockPay(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_mockPay, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'mockPay',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsRechargeController_getPointsLogs: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/app/points/logs',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RechargeController)),
            ...(fetchMiddlewares<RequestHandler>(RechargeController.prototype.getPointsLogs)),

            async function RechargeController_getPointsLogs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRechargeController_getPointsLogs, request, response });

                const controller = new RechargeController();

              await templateService.apiHandler({
                methodName: 'getPointsLogs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPaymentController_mockCallback: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"MockCallbackBody"},
        };
        app.post('/api/payment/callback/mock',
            ...(fetchMiddlewares<RequestHandler>(PaymentController)),
            ...(fetchMiddlewares<RequestHandler>(PaymentController.prototype.mockCallback)),

            async function PaymentController_mockCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPaymentController_mockCallback, request, response });

                const controller = new PaymentController();

              await templateService.apiHandler({
                methodName: 'mockCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOpenaiController_analyzeImage: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AnalyzeImageBody"},
        };
        app.post('/app/analyzeImage',
            ...(fetchMiddlewares<RequestHandler>(OpenaiController)),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController.prototype.analyzeImage)),

            async function OpenaiController_analyzeImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOpenaiController_analyzeImage, request, response });

                const controller = new OpenaiController();

              await templateService.apiHandler({
                methodName: 'analyzeImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOpenaiController_generateText: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"GenerateTextBody"},
        };
        app.post('/app/generateText',
            ...(fetchMiddlewares<RequestHandler>(OpenaiController)),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController.prototype.generateText)),

            async function OpenaiController_generateText(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOpenaiController_generateText, request, response });

                const controller = new OpenaiController();

              await templateService.apiHandler({
                methodName: 'generateText',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOpenaiController_generateImage: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"OpenaiGenerateImageBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/generateImage',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController)),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController.prototype.generateImage)),

            async function OpenaiController_generateImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOpenaiController_generateImage, request, response });

                const controller = new OpenaiController();

              await templateService.apiHandler({
                methodName: 'generateImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOpenaiController_generateImageByChatCompletions: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"GenerateImageByChatBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/textToimageNew',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController)),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController.prototype.generateImageByChatCompletions)),

            async function OpenaiController_generateImageByChatCompletions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOpenaiController_generateImageByChatCompletions, request, response });

                const controller = new OpenaiController();

              await templateService.apiHandler({
                methodName: 'generateImageByChatCompletions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOpenaiController_getUploadTaskStatus: Record<string, TsoaRoute.ParameterSchema> = {
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
        };
        app.get('/app/textToImage/tasks/:taskId',
            ...(fetchMiddlewares<RequestHandler>(OpenaiController)),
            ...(fetchMiddlewares<RequestHandler>(OpenaiController.prototype.getUploadTaskStatus)),

            async function OpenaiController_getUploadTaskStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOpenaiController_getUploadTaskStatus, request, response });

                const controller = new OpenaiController();

              await templateService.apiHandler({
                methodName: 'getUploadTaskStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_list: Record<string, TsoaRoute.ParameterSchema> = {
                category_id: {"in":"query","name":"category_id","dataType":"double"},
                description: {"in":"query","name":"description","dataType":"string"},
                title: {"in":"query","name":"title","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/app/images',
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.list)),

            async function ImageController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_list, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_detail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/app/images/:id',
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.detail)),

            async function ImageController_detail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_detail, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'detail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateImageBody"},
        };
        app.post('/app/images',
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.create)),

            async function ImageController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_create, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateImageBody"},
        };
        app.put('/app/images/:id',
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.update)),

            async function ImageController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_update, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsImageController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/app/images/:id',
            ...(fetchMiddlewares<RequestHandler>(ImageController)),
            ...(fetchMiddlewares<RequestHandler>(ImageController.prototype.delete)),

            async function ImageController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsImageController_delete, request, response });

                const controller = new ImageController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGalleryController_getGalleryList: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
                generation_type: {"in":"query","name":"generation_type","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"string"},
        };
        app.get('/app/gallery',
            ...(fetchMiddlewares<RequestHandler>(GalleryController)),
            ...(fetchMiddlewares<RequestHandler>(GalleryController.prototype.getGalleryList)),

            async function GalleryController_getGalleryList(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGalleryController_getGalleryList, request, response });

                const controller = new GalleryController();

              await templateService.apiHandler({
                methodName: 'getGalleryList',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGalleryController_getMyCreations: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/app/my-creations',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GalleryController)),
            ...(fetchMiddlewares<RequestHandler>(GalleryController.prototype.getMyCreations)),

            async function GalleryController_getMyCreations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGalleryController_getMyCreations, request, response });

                const controller = new GalleryController();

              await templateService.apiHandler({
                methodName: 'getMyCreations',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_list: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"double"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"string"},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"string"},
        };
        app.get('/app/categories',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.list)),

            async function CategoryController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_list, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_getAllEnabled: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/app/categories/enabled',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.getAllEnabled)),

            async function CategoryController_getAllEnabled(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_getAllEnabled, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'getAllEnabled',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_detail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/app/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.detail)),

            async function CategoryController_detail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_detail, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'detail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateCategoryBody"},
        };
        app.post('/app/categories',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.create)),

            async function CategoryController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_create, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCategoryBody"},
        };
        app.put('/app/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.update)),

            async function CategoryController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_update, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_updateSortOrder: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSortOrderBody"},
        };
        app.put('/app/categories/:id/sort',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.updateSortOrder)),

            async function CategoryController_updateSortOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_updateSortOrder, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'updateSortOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCategoryController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/app/categories/:id',
            ...(fetchMiddlewares<RequestHandler>(CategoryController)),
            ...(fetchMiddlewares<RequestHandler>(CategoryController.prototype.delete)),

            async function CategoryController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCategoryController_delete, request, response });

                const controller = new CategoryController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBananaTextToImageController_generateImage: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"BananaGenerateImageBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/banana-CreateImage',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BananaTextToImageController)),
            ...(fetchMiddlewares<RequestHandler>(BananaTextToImageController.prototype.generateImage)),

            async function BananaTextToImageController_generateImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBananaTextToImageController_generateImage, request, response });

                const controller = new BananaTextToImageController();

              await templateService.apiHandler({
                methodName: 'generateImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LoginBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/app/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getCurrentUser: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/app/me',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getCurrentUser)),

            async function AuthController_getCurrentUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getCurrentUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getCurrentUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_sendCode: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SendCodeBody"},
        };
        app.post('/app/send-code',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.sendCode)),

            async function AuthController_sendCode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_sendCode, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'sendCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_register: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"RegisterBody"},
        };
        app.post('/app/register',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.register)),

            async function AuthController_register(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_register, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'register',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAppModelController_list: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","dataType":"string"},
                manufacturer: {"in":"query","name":"manufacturer","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/app/models',
            ...(fetchMiddlewares<RequestHandler>(AppModelController)),
            ...(fetchMiddlewares<RequestHandler>(AppModelController.prototype.list)),

            async function AppModelController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAppModelController_list, request, response });

                const controller = new AppModelController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminOrderController_listOrders: Record<string, TsoaRoute.ParameterSchema> = {
                orderNo: {"in":"query","name":"orderNo","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"string"},
                userId: {"in":"query","name":"userId","dataType":"double"},
                username: {"in":"query","name":"username","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/v1/admin/orders',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController)),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController.prototype.listOrders)),

            async function AdminOrderController_listOrders(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminOrderController_listOrders, request, response });

                const controller = new AdminOrderController();

              await templateService.apiHandler({
                methodName: 'listOrders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminOrderController_orderDetail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/admin/orders/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController)),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController.prototype.orderDetail)),

            async function AdminOrderController_orderDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminOrderController_orderDetail, request, response });

                const controller = new AdminOrderController();

              await templateService.apiHandler({
                methodName: 'orderDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminOrderController_listCustomers: Record<string, TsoaRoute.ParameterSchema> = {
                username: {"in":"query","name":"username","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"double"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/v1/admin/customers',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController)),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController.prototype.listCustomers)),

            async function AdminOrderController_listCustomers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminOrderController_listCustomers, request, response });

                const controller = new AdminOrderController();

              await templateService.apiHandler({
                methodName: 'listCustomers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminOrderController_customerDetail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/admin/customers/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController)),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController.prototype.customerDetail)),

            async function AdminOrderController_customerDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminOrderController_customerDetail, request, response });

                const controller = new AdminOrderController();

              await templateService.apiHandler({
                methodName: 'customerDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminOrderController_customerPointsLogs: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
                changeType: {"in":"query","name":"changeType","dataType":"string"},
        };
        app.get('/api/v1/admin/customers/:id/points-logs',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController)),
            ...(fetchMiddlewares<RequestHandler>(AdminOrderController.prototype.customerPointsLogs)),

            async function AdminOrderController_customerPointsLogs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminOrderController_customerPointsLogs, request, response });

                const controller = new AdminOrderController();

              await templateService.apiHandler({
                methodName: 'customerPointsLogs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminModelController_list: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"double"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/v1/admin/models',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController)),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController.prototype.list)),

            async function AdminModelController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminModelController_list, request, response });

                const controller = new AdminModelController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminModelController_detail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/admin/models/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController)),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController.prototype.detail)),

            async function AdminModelController_detail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminModelController_detail, request, response });

                const controller = new AdminModelController();

              await templateService.apiHandler({
                methodName: 'detail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminModelController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateModelBody"},
        };
        app.post('/api/v1/admin/models',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController)),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController.prototype.create)),

            async function AdminModelController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminModelController_create, request, response });

                const controller = new AdminModelController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminModelController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateModelBody"},
        };
        app.put('/api/v1/admin/models/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController)),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController.prototype.update)),

            async function AdminModelController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminModelController_update, request, response });

                const controller = new AdminModelController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminModelController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/api/v1/admin/models/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController)),
            ...(fetchMiddlewares<RequestHandler>(AdminModelController.prototype.delete)),

            async function AdminModelController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminModelController_delete, request, response });

                const controller = new AdminModelController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AdminLoginBody"},
        };
        app.post('/api/v1/admin/login',
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.login)),

            async function AdminController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_login, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminController_profile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/admin/profile',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.profile)),

            async function AdminController_profile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_profile, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'profile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminController_logout: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/admin/logout',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.logout)),

            async function AdminController_logout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_logout, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'logout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminController_listUsers: Record<string, TsoaRoute.ParameterSchema> = {
                username: {"in":"query","name":"username","dataType":"string"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/v1/admin/users',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.listUsers)),

            async function AdminController_listUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminController_listUsers, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'listUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_list: Record<string, TsoaRoute.ParameterSchema> = {
                name: {"in":"query","name":"name","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"double"},
                page: {"in":"query","name":"page","dataType":"double"},
                pageSize: {"in":"query","name":"pageSize","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"string"},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"string"},
        };
        app.get('/api/v1/admin/categories',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.list)),

            async function AdminCategoryController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_list, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_getAllEnabled: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/admin/categories/enabled',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.getAllEnabled)),

            async function AdminCategoryController_getAllEnabled(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_getAllEnabled, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'getAllEnabled',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_detail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.get('/api/v1/admin/categories/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.detail)),

            async function AdminCategoryController_detail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_detail, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'detail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AdminCreateCategoryBody"},
        };
        app.post('/api/v1/admin/categories',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.create)),

            async function AdminCategoryController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_create, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"AdminUpdateCategoryBody"},
        };
        app.put('/api/v1/admin/categories/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.update)),

            async function AdminCategoryController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_update, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_updateSortOrder: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"AdminUpdateSortOrderBody"},
        };
        app.put('/api/v1/admin/categories/:id/sort',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.updateSortOrder)),

            async function AdminCategoryController_updateSortOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_updateSortOrder, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'updateSortOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminCategoryController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"double"},
        };
        app.delete('/api/v1/admin/categories/:id',
            authenticateMiddleware([{"adminJwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController)),
            ...(fetchMiddlewares<RequestHandler>(AdminCategoryController.prototype.delete)),

            async function AdminCategoryController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminCategoryController_delete, request, response });

                const controller = new AdminCategoryController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
