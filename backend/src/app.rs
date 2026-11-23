use async_trait::async_trait;
use axum::Router as AxumRouter;
use loco_rs::{
    app::{AppContext, Hooks},
    bgworker::Queue,
    boot::{create_app, BootResult, StartMode},
    config::Config,
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    Result,
};
use migration::Migrator;
use std::path::Path;

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    async fn boot(
        mode: StartMode,
        environment: &Environment,
        config: Config,
    ) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
            .add_route(crate::controllers::auth::routes())
            .add_route(crate::controllers::student::routes())
            .add_route(crate::controllers::course::routes())
            .add_route(crate::controllers::assignment::routes())
            .add_route(crate::controllers::attendance::routes())
            .add_route(crate::controllers::timetable::routes())
            .add_route(crate::controllers::examination::routes())
            .add_route(crate::controllers::result::routes())
            .add_route(crate::controllers::material::routes())
            .add_route(crate::controllers::announcement::routes())
            .add_route(crate::controllers::request::routes())
            .add_route(crate::controllers::notification::routes())
            .add_route(crate::controllers::admin::routes())
            .add_route(crate::controllers::faculty::routes())
    }

    async fn connect_workers(_ctx: &AppContext, _queue: &Queue) -> Result<()> {
        Ok(())
    }

    fn register_tasks(_tasks: &mut Tasks) {}

    async fn truncate(_ctx: &AppContext) -> Result<()> {
        Ok(())
    }

    async fn seed(ctx: &AppContext, _path: &Path) -> Result<()> {
        crate::models::seed::seed_database(&ctx.db)
            .await
            .map_err(|e| loco_rs::Error::string(&e.to_string()))?;
        Ok(())
    }

    async fn after_routes(router: AxumRouter, ctx: &AppContext) -> Result<AxumRouter> {
        if let Err(e) = crate::models::seed::seed_database(&ctx.db).await {
            tracing::warn!("Auto-seed check: {}", e);
        }
        Ok(router)
    }
}
